import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/auth/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit, isValidEmail, requestKey } from "@/lib/security/rate-limit";
import { initiateStkPush, maskPhone, normalizeKenyanPhone } from "@/lib/payments/mpesa";
import { getGivingSettings, getMpesaCredentials, mpesaCallbackUrl, onlineGivingAvailable } from "@/lib/payments/settings";

type DonationIntentPayload = {
  campaign_id?: string;
  amount?: number;
  currency?: string;
  donor_name?: string;
  donor_email?: string;
  phone?: string;
  is_anonymous?: boolean;
  consent_to_updates?: boolean;
};

export async function POST(request: Request) {
  const rate = consumeRateLimit(requestKey(request, "donation-intent"), 10);
  if (!rate.allowed) return NextResponse.json({ error: "Please wait before starting another giving attempt." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const online = await onlineGivingAvailable();
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && !online) return NextResponse.json({ error: "Online giving is not switched on. Please use the M-Pesa or bank details on this page." }, { status: 503 });

  const actor = await getAdminActor();
  const payload = await request.json().catch(() => null) as DonationIntentPayload | null;
  const amount = Number(payload?.amount);
  const currency = payload?.currency?.toUpperCase() ?? "KES";
  const email = payload?.donor_email?.trim().toLowerCase() ?? "";
  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim() ?? crypto.randomUUID();
  const phone = normalizeKenyanPhone(payload?.phone ?? "");

  if (!Number.isInteger(amount) || amount < 50 || amount > 250000) return NextResponse.json({ error: "Choose a whole amount between KES 50 and KES 250,000. For larger gifts, please use bank transfer." }, { status: 400 });
  if (currency !== "KES") return NextResponse.json({ error: "This giving journey currently accepts KES only." }, { status: 400 });
  if (email && !isValidEmail(email)) return NextResponse.json({ error: "Enter a valid receipt email or leave it blank." }, { status: 400 });
  if (online && !phone) return NextResponse.json({ error: "Enter the Safaricom number that should receive the M-Pesa prompt, for example 0712 345 678." }, { status: 400 });
  if (idempotencyKey.length < 12 || idempotencyKey.length > 120) return NextResponse.json({ error: "A valid payment request key is required." }, { status: 400 });

  const { data: campaign, error: campaignError } = await actor.supabase.from("fundraising_campaigns").select("id").eq("id", payload?.campaign_id ?? "").eq("status", "active").maybeSingle();
  if (campaignError || !campaign) return NextResponse.json({ error: "That campaign is no longer accepting gifts." }, { status: 400 });

  const record = {
    id: crypto.randomUUID(),
    campaign_id: campaign.id,
    donor_id: actor.user?.id ?? null,
    donor_name: payload?.is_anonymous ? null : payload?.donor_name?.trim().slice(0, 160) || null,
    donor_email: email || null,
    receipt_email: email || null,
    is_anonymous: payload?.is_anonymous === true,
    recurring: false,
    consent_to_updates: payload?.consent_to_updates === true,
    amount,
    currency,
    status: "pending",
    idempotency_key: idempotencyKey,
  };

  const { error } = await actor.supabase.from("donations").insert(record as never);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This payment attempt was already received. Please check your phone before trying again." }, { status: 409 });
    return NextResponse.json({ error: "We could not save your gift. Please try again." }, { status: 400 });
  }

  if (!online) {
    return NextResponse.json({ ok: true, donation_id: record.id, checkout: null, message: "Development mode: your gift was recorded but no money was requested, because online giving is not switched on." }, { status: 201 });
  }

  const admin = createAdminClient();
  const [credentials, settings] = await Promise.all([getMpesaCredentials(), getGivingSettings()]);
  const callbackUrl = mpesaCallbackUrl();
  if (!admin || !credentials || !callbackUrl || !phone) return NextResponse.json({ error: "Online giving is not fully configured. Please use the M-Pesa or bank details on this page." }, { status: 503 });

  try {
    const push = await initiateStkPush(credentials, { phone, amount, accountReference: settings.mpesaAccountReference || "WKT-GIFT", description: "Donation", callbackUrl });
    await admin.from("donations").update({ provider: "mpesa", checkout_session_id: push.checkoutRequestId, metadata: { channel: "mpesa_stk", phone: maskPhone(phone), merchant_request_id: push.merchantRequestId } }).eq("id", record.id);
    return NextResponse.json({ ok: true, donation_id: record.id, checkout: "mpesa_stk", message: "Check your phone and enter your M-Pesa PIN to complete your gift." }, { status: 201 });
  } catch (stkError) {
    await admin.from("donations").update({ status: "failed", provider: "mpesa", failure_reason: stkError instanceof Error ? stkError.message.slice(0, 300) : "M-Pesa request failed", reconciled_at: new Date().toISOString() }).eq("id", record.id);
    return NextResponse.json({ error: "M-Pesa could not send the payment prompt. Check the number and try again, or use the Paybill details on this page." }, { status: 502 });
  }
}
