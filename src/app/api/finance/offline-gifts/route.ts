import { NextResponse } from "next/server";
import { getAdminActor, hasFinanceAccess } from "@/lib/auth/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail } from "@/lib/security/rate-limit";
import { reconcileDonation } from "@/lib/payments/reconcile";

const methods = { mpesa_paybill: "M-Pesa Paybill", mpesa_till: "M-Pesa Till", bank_transfer: "Bank transfer", cash: "Cash", cheque: "Cheque" } as const;

/** Finance records a gift that arrived outside the website so the donor gets a receipt and the campaign total is right. */
export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasFinanceAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified finance access required." }, { status: 403 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Set SUPABASE_SERVICE_ROLE_KEY on the server first." }, { status: 503 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const method = typeof body?.method === "string" && body.method in methods ? body.method as keyof typeof methods : null;
  const amount = Number(body?.amount);
  const reference = typeof body?.reference === "string" ? body.reference.trim().toUpperCase().slice(0, 60) : "";
  const donorName = typeof body?.donor_name === "string" ? body.donor_name.trim().slice(0, 160) : "";
  const email = typeof body?.receipt_email === "string" ? body.receipt_email.trim().toLowerCase() : "";
  const campaignId = typeof body?.campaign_id === "string" && body.campaign_id ? body.campaign_id : null;
  const receivedOn = typeof body?.received_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.received_on) ? body.received_on : null;

  if (!method) return NextResponse.json({ error: "Choose how the gift was received." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 50_000_000) return NextResponse.json({ error: "Enter the amount received in KES." }, { status: 400 });
  if (method !== "cash" && reference.length < 4) return NextResponse.json({ error: "Enter the M-Pesa code or bank reference so the gift can be matched to a statement." }, { status: 400 });
  if (email && !isValidEmail(email)) return NextResponse.json({ error: "Enter a valid receipt email or leave it blank." }, { status: 400 });
  if (receivedOn && new Date(receivedOn).getTime() > Date.now() + 86_400_000) return NextResponse.json({ error: "The received date cannot be in the future." }, { status: 400 });
  if (campaignId) {
    const { data: campaign } = await admin.from("fundraising_campaigns").select("id").eq("id", campaignId).maybeSingle();
    if (!campaign) return NextResponse.json({ error: "That campaign could not be found." }, { status: 400 });
  }

  const providerEventId = method === "cash" ? `offline:cash:${crypto.randomUUID()}` : `offline:${method}:${reference}`;
  const { data: duplicate } = await admin.from("payment_events").select("id").eq("provider_event_id", providerEventId).maybeSingle();
  if (duplicate) return NextResponse.json({ error: `A gift with reference ${reference} has already been recorded.` }, { status: 409 });

  const id = crypto.randomUUID();
  const { error: insertError } = await admin.from("donations").insert({
    id, campaign_id: campaignId, amount: Math.round(amount * 100) / 100, currency: "KES", status: "pending",
    donor_name: donorName || null, is_anonymous: !donorName, donor_email: email || null, receipt_email: email || null,
    idempotency_key: `offline-${id}`, created_at: receivedOn ? new Date(`${receivedOn}T09:00:00+03:00`).toISOString() : new Date().toISOString(),
    metadata: { channel: method, recorded_by: actor.user.id },
  });
  if (insertError) return NextResponse.json({ error: "The gift could not be recorded." }, { status: 400 });

  const result = await reconcileDonation(admin, { donationId: id, status: "succeeded", provider: method, providerEventId, eventType: "offline_gift_recorded", paymentReference: method === "cash" ? null : reference, payload: { recorded_by: actor.user.id } });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  await admin.from("donations").update({ reconciled_by: actor.user.id }).eq("id", id);
  const { data: saved } = await admin.from("donations").select("receipt_number").eq("id", id).maybeSingle();
  await admin.from("audit_logs").insert({ actor_id: actor.user.id, action: "offline_gift_recorded", entity_type: "donation", entity_id: id, metadata: { method, amount, reference: method === "cash" ? null : reference } });
  return NextResponse.json({ ok: true, receipt_number: saved?.receipt_number ?? null }, { status: 201 });
}
