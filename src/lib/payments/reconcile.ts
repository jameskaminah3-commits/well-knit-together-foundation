import type { SupabaseClient } from "@supabase/supabase-js";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { donationFailed, donationReceipt } from "@/lib/email/templates";

type ReconcileInput = {
  donationId: string;
  status: "succeeded" | "failed" | "refunded";
  provider: string;
  providerEventId: string;
  eventType: string;
  paymentReference?: string | null;
  failureReason?: string | null;
  payload?: Record<string, unknown>;
};

export type ReconcileResult = { ok: true; duplicate?: boolean } | { ok: false; error: string };

/**
 * Applies a confirmed payment outcome to a donation exactly once, records the
 * provider event, and sends the receipt or failure email. Requires the
 * service-role client: callers must have authenticated the event first.
 */
export async function reconcileDonation(admin: SupabaseClient, input: ReconcileInput): Promise<ReconcileResult> {
  const { data: event, error: eventError } = await admin.from("payment_events").insert({
    provider: input.provider,
    provider_event_id: input.providerEventId,
    event_type: input.eventType,
    donation_id: input.donationId,
    payment_reference: input.paymentReference ?? null,
    payload: { donation_id: input.donationId, status: input.status, event_type: input.eventType, payment_reference: input.paymentReference ?? null, ...(input.payload ?? {}) },
  }).select("id").single();

  if (eventError?.code === "23505") return { ok: true, duplicate: true };
  if (eventError || !event) return { ok: false, error: "The payment event could not be recorded." };

  const { data: current } = await admin.from("donations").select("id, status, provider_reference").eq("id", input.donationId).maybeSingle();
  if (!current) {
    await admin.from("payment_events").update({ status: "failed", error_message: "Donation record not found." }).eq("id", event.id);
    return { ok: false, error: "Donation not found." };
  }

  // A confirmed success is final: a later failure or duplicate cannot undo it,
  // but a later event may supply the M-Pesa receipt code.
  if (current.status === "succeeded" && input.status !== "refunded") {
    if (input.paymentReference && !current.provider_reference) {
      await admin.from("donations").update({ provider_reference: input.paymentReference }).eq("id", input.donationId);
    }
    await admin.from("payment_events").update({ status: "ignored", processed_at: new Date().toISOString() }).eq("id", event.id);
    return { ok: true, duplicate: true };
  }

  const { data: donation, error: donationError } = await admin.from("donations").update({
    status: input.status,
    provider: input.provider,
    provider_reference: input.paymentReference ?? current.provider_reference ?? null,
    failure_reason: input.failureReason ?? null,
    reconciled_at: new Date().toISOString(),
  }).eq("id", input.donationId).select("id, donor_name, donor_email, receipt_email, amount, currency, is_anonymous").maybeSingle();

  if (donationError || !donation) {
    await admin.from("payment_events").update({ status: "failed", error_message: donationError?.message ?? "Donation could not be updated." }).eq("id", event.id);
    return { ok: false, error: "The payment was recorded but could not be reconciled." };
  }

  const deliveryEmail = donation.receipt_email ?? donation.donor_email;
  const donorName = donation.is_anonymous ? "Supporter" : donation.donor_name ?? "Supporter";
  const amount = Number(donation.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 });
  if (deliveryEmail && input.status === "succeeded") {
    const { data: receipt } = await admin.from("donation_receipts").select("receipt_number").eq("donation_id", donation.id).maybeSingle();
    if (receipt?.receipt_number) {
      const email = donationReceipt({ donorName, amount, currency: donation.currency, receiptNumber: receipt.receipt_number });
      await deliverTransactionalEmail({ messageType: "donation_receipt", to: deliveryEmail, subject: email.subject, html: email.html, text: email.text, dedupeKey: `donation-receipt:${donation.id}` });
    }
  }
  if (deliveryEmail && input.status === "failed") {
    const email = donationFailed({ donorName, amount, currency: donation.currency });
    await deliverTransactionalEmail({ messageType: "donation_failed", to: deliveryEmail, subject: email.subject, html: email.html, text: email.text, dedupeKey: `donation-failed:${donation.id}:${input.providerEventId}` });
  }

  await admin.from("payment_events").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", event.id);
  return { ok: true };
}
