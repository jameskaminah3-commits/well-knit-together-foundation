import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const eventStatuses: Record<string, "delivered" | "bounced" | "complained" | "failed" | undefined> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

function validSignature(rawBody: string, request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const identifier = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signatures = request.headers.get("svix-signature")?.split(" ") ?? [];
  if (!secret || !identifier || !timestamp || !signatures.length) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;
  const encodedSecret = secret.replace(/^whsec_/, "");
  const signingSecret = Buffer.from(encodedSecret, "base64");
  const expected = createHmac("sha256", signingSecret).update(`${identifier}.${timestamp}.${rawBody}`).digest("base64");
  return signatures.some((signature) => {
    const supplied = signature.replace(/^v\d,/, "");
    if (supplied.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 200_000 || !validSignature(rawBody, request)) return NextResponse.json({ error: "Invalid email webhook." }, { status: 401 });
  const payload = await Promise.resolve().then(() => JSON.parse(rawBody) as { type?: string; data?: { email_id?: string } }).catch(() => null);
  const deliveryStatus = payload ? eventStatuses[payload.type ?? ""] : undefined;
  const providerMessageId = payload?.data?.email_id;
  if (!deliveryStatus || !providerMessageId) return NextResponse.json({ ok: true, ignored: true });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
  const { error } = await admin.from("email_messages").update({ delivery_status: deliveryStatus, status: deliveryStatus === "delivered" ? "sent" : "failed", last_error: deliveryStatus === "delivered" ? null : `Resend delivery event: ${deliveryStatus}`, updated_at: new Date().toISOString() }).eq("provider_message_id", providerMessageId);
  if (error) return NextResponse.json({ error: "Email delivery could not be recorded." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
