import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcileDonation } from "@/lib/payments/reconcile";

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

/** Generic HMAC-signed payment webhook for card or other providers. M-Pesa uses /api/payments/mpesa/callback. */
export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const admin = createAdminClient();
  if (!secret || !admin) return NextResponse.json({ error: "Payment reconciliation is not configured." }, { status: 503 });

  const rawBody = await request.text();
  if (rawBody.length > 100_000) return NextResponse.json({ error: "Payment event is too large." }, { status: 413 });
  const signature = request.headers.get("x-payment-signature") ?? "";
  if (!signaturesMatch(rawBody, signature, secret)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  let payload: PaymentWebhook;
  try {
    payload = JSON.parse(rawBody) as PaymentWebhook;
  } catch {
    return NextResponse.json({ error: "Malformed payment event." }, { status: 400 });
  }
  if (!payload.provider || !payload.provider_event_id || !payload.event_type || !payload.status || !payload.donation_id) {
    return NextResponse.json({ error: "Incomplete payment event." }, { status: 400 });
  }

  const result = await reconcileDonation(admin, {
    donationId: payload.donation_id,
    status: payload.status,
    provider: payload.provider,
    providerEventId: payload.provider_event_id,
    eventType: payload.event_type,
    paymentReference: payload.payment_reference ?? null,
    failureReason: payload.failure_reason ?? null,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, donation_id: payload.donation_id, ...(result.duplicate ? { duplicate: true } : {}) });
}
