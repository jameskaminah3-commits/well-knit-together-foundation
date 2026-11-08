import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentWebhook = {
  provider?: string;
  provider_event_id?: string;
  event_type?: string;
  donation_id?: string;
  payment_reference?: string;
  status?: "succeeded" | "failed" | "refunded";
  failure_reason?: string;
};

function signaturesMatch(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const supplied = signature.replace(/^sha256=/, "");
  return supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const admin = createAdminClient();
  if (!secret || !admin) return NextResponse.json({ error: "Payment reconciliation is not configured." }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-payment-signature") ?? "";
  if (!signaturesMatch(rawBody, signature, secret)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  const payload = JSON.parse(rawBody) as PaymentWebhook;
  if (!payload.provider || !payload.provider_event_id || !payload.event_type || !payload.status || !payload.donation_id) {
    return NextResponse.json({ error: "Incomplete payment event." }, { status: 400 });
  }

  const { data: event, error: eventError } = await admin.from("payment_events").insert({
    provider: payload.provider,
    provider_event_id: payload.provider_event_id,
    event_type: payload.event_type,
    donation_id: payload.donation_id,
    payment_reference: payload.payment_reference ?? null,
    payload: {
      donation_id: payload.donation_id,
      payment_reference: payload.payment_reference ?? null,
      status: payload.status,
      event_type: payload.event_type,
    },
  }).select("id").single();

  if (eventError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (eventError || !event) return NextResponse.json({ error: "The payment event could not be recorded." }, { status: 500 });

  const { error: donationError } = await admin.from("donations").update({
    status: payload.status,
    provider: payload.provider,
    provider_reference: payload.payment_reference ?? null,
    failure_reason: payload.failure_reason ?? null,
    reconciled_at: new Date().toISOString(),
  }).eq("id", payload.donation_id);

  if (donationError) {
    await admin.from("payment_events").update({ status: "failed", error_message: donationError.message }).eq("id", event.id);
    return NextResponse.json({ error: "The payment was recorded but could not be reconciled." }, { status: 500 });
  }

  await admin.from("payment_events").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", event.id);
  return NextResponse.json({ ok: true, donation_id: payload.donation_id });
}
