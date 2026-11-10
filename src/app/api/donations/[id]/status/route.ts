import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queryStkPush } from "@/lib/payments/mpesa";
import { reconcileDonation } from "@/lib/payments/reconcile";
import { getMpesaCredentials } from "@/lib/payments/settings";
import { consumeRateLimit, requestKey } from "@/lib/security/rate-limit";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Lets the giving form follow an M-Pesa prompt. Returns only the status of the
 * gift whose unguessable id the browser already holds. If Safaricom's callback
 * has not arrived after a short wait, asks Daraja directly.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const rate = consumeRateLimit(requestKey(request, `donation-status:${id}`), 60, 10 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ status: "pending" }, { headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured." }, { status: 503 });
  const { data: donation } = await admin.from("donations").select("id, status, failure_reason, receipt_number, checkout_session_id, created_at, metadata").eq("id", id).maybeSingle();
  if (!donation) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (donation.status === "pending" && donation.checkout_session_id) {
    const metadata = (donation.metadata ?? {}) as Record<string, unknown>;
    const ageMs = Date.now() - new Date(donation.created_at).getTime();
    const lastQuery = typeof metadata.last_status_query_at === "string" ? new Date(metadata.last_status_query_at).getTime() : 0;
    if (ageMs > 25_000 && Date.now() - lastQuery > 10_000) {
      await admin.from("donations").update({ metadata: { ...metadata, last_status_query_at: new Date().toISOString() } }).eq("id", id);
      const credentials = await getMpesaCredentials();
      if (credentials) {
        const result = await queryStkPush(credentials, donation.checkout_session_id).catch(() => null);
        if (result && result.state !== "pending") {
          await reconcileDonation(admin, { donationId: id, status: result.state, provider: "mpesa", providerEventId: `${donation.checkout_session_id}:query`, eventType: "stk_query", failureReason: result.state === "failed" ? result.resultDesc ?? "Payment was not completed." : null, payload: { result_code: result.resultCode } });
          const { data: refreshed } = await admin.from("donations").select("status, failure_reason, receipt_number").eq("id", id).maybeSingle();
          if (refreshed) return NextResponse.json({ status: refreshed.status, failure_reason: refreshed.failure_reason, receipt_number: refreshed.receipt_number });
        }
      }
    }
  }
  return NextResponse.json({ status: donation.status, failure_reason: donation.failure_reason, receipt_number: donation.receipt_number });
}
