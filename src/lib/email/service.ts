import { createAdminClient } from "@/lib/supabase/admin";

type EmailInput = {
  messageType: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  dedupeKey: string;
  recipientUserId?: string | null;
  replyTo?: string;
};

type EmailResult = {
  status: "sent" | "failed" | "skipped" | "duplicate";
  providerMessageId?: string;
  reason?: string;
};

function configured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function emailDeliveryConfigured() {
  return configured();
}

export function emailWebhookConfigured() {
  return Boolean(process.env.RESEND_WEBHOOK_SECRET);
}

export async function deliverTransactionalEmail(input: EmailInput): Promise<EmailResult> {
  const admin = createAdminClient();
  if (!admin) return { status: "skipped", reason: "email_log_not_configured" };

  const { data: message, error: insertError } = await admin
    .from("email_messages")
    .insert({
      message_type: input.messageType,
      recipient_email: input.to,
      recipient_user_id: input.recipientUserId ?? null,
      subject: input.subject,
      dedupe_key: input.dedupeKey,
      status: configured() ? "queued" : "skipped",
      last_error: configured() ? null : "Resend is not configured yet.",
    })
    .select("id")
    .single();

  if (insertError?.code === "23505") return { status: "duplicate" };
  if (insertError || !message) return { status: "failed", reason: "email_log_insert_failed" };
  if (!configured()) return { status: "skipped", reason: "resend_not_configured" };

  let response: Response | null = null;
  let attempts = 0;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    attempts = attempt;
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo || process.env.EMAIL_REPLY_TO ? { reply_to: input.replyTo || process.env.EMAIL_REPLY_TO } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);
    if (response?.ok || attempt === 2) break;
  }

  if (!response?.ok) {
    await admin.from("email_messages").update({ status: "failed", attempts, last_error: "Resend did not accept the message after two attempts.", updated_at: new Date().toISOString() }).eq("id", message.id);
    return { status: "failed", reason: "resend_rejected" };
  }

  const result = await response.json().catch(() => null) as { id?: string } | null;
  await admin.from("email_messages").update({ status: "sent", delivery_status: "accepted", attempts, provider_message_id: result?.id ?? null, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", message.id);
  return { status: "sent", providerMessageId: result?.id };
}
