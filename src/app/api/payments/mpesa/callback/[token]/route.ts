import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpesaCallbackToken, tokensMatch } from "@/lib/payments/crypto";
import { parseStkCallback } from "@/lib/payments/mpesa";
import { reconcileDonation } from "@/lib/payments/reconcile";

const accepted = () => NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

/**
 * Safaricom posts the STK Push outcome here. Daraja callbacks are not signed,
 * so the URL carries an unguessable token, the CheckoutRequestID must match a
 * gift we started, and the paid amount must match that gift.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const expected = mpesaCallbackToken();
  if (!expected || !tokensMatch(token, expected)) return NextResponse.json({ ResultCode: 1, ResultDesc: "Rejected" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ResultCode: 1, ResultDesc: "Not configured" }, { status: 503 });

  const raw = await request.text();
  if (raw.length > 20_000) return NextResponse.json({ ResultCode: 1, ResultDesc: "Too large" }, { status: 413 });
  let callback;
  try {
    callback = parseStkCallback(JSON.parse(raw));
  } catch {
    callback = null;
  }
  if (!callback) return NextResponse.json({ ResultCode: 1, ResultDesc: "Malformed" }, { status: 400 });

  const { data: donation } = await admin.from("donations").select("id, amount").eq("checkout_session_id", callback.checkoutRequestId).maybeSingle();
  if (!donation) return accepted();

  const succeeded = callback.resultCode === 0;
  if (succeeded && callback.amount !== undefined && Math.round(callback.amount) !== Math.round(Number(donation.amount))) {
    await reconcileDonation(admin, { donationId: donation.id, status: "failed", provider: "mpesa", providerEventId: `${callback.checkoutRequestId}:callback`, eventType: "stk_callback_amount_mismatch", paymentReference: callback.receiptNumber ?? null, failureReason: "Paid amount did not match the gift. Finance will review.", payload: { result_code: callback.resultCode } });
    return accepted();
  }

  await reconcileDonation(admin, {
    donationId: donation.id,
    status: succeeded ? "succeeded" : "failed",
    provider: "mpesa",
    providerEventId: `${callback.checkoutRequestId}:callback`,
    eventType: "stk_callback",
    paymentReference: callback.receiptNumber ?? null,
    failureReason: succeeded ? null : callback.resultDesc || "Payment was not completed.",
    payload: { result_code: callback.resultCode, merchant_request_id: callback.merchantRequestId },
  });
  return accepted();
}
