import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/auth/admin-access";
import { consumeRateLimit, isValidEmail, requestKey } from "@/lib/security/rate-limit";

type DonationIntentPayload = {
  campaign_id?: string;
  amount?: number;
  currency?: string;
  donor_name?: string;
  donor_email?: string;
  is_anonymous?: boolean;
  recurring?: boolean;
  consent_to_updates?: boolean;
};

export async function POST(request: Request) {
  const rate = consumeRateLimit(requestKey(request, "donation-intent"), 10);
  if (!rate.allowed) return NextResponse.json({ error: "Please wait before starting another giving attempt." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (process.env.NODE_ENV === "production" && process.env.PAYMENT_PROVIDER_ENABLED !== "true") return NextResponse.json({ error: "Secure giving checkout is temporarily unavailable. Please try again later or contact the foundation." }, { status: 503 });
  const actor = await getAdminActor();
  const payload = await request.json().catch(() => null) as DonationIntentPayload | null;
  const amount = Number(payload?.amount);
  const currency = payload?.currency?.toUpperCase() ?? "KES";
  const email = payload?.donor_email?.trim().toLowerCase() ?? "";
  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim() ?? crypto.randomUUID();

  if (!Number.isFinite(amount) || amount < 50 || amount > 5000000) return NextResponse.json({ error: "Choose an amount between KES 50 and KES 5,000,000." }, { status: 400 });
  if (currency !== "KES") return NextResponse.json({ error: "This giving journey currently accepts KES only." }, { status: 400 });
  if (email && !isValidEmail(email)) return NextResponse.json({ error: "Enter a valid receipt email or leave it blank." }, { status: 400 });
  if (idempotencyKey.length < 12 || idempotencyKey.length > 120) return NextResponse.json({ error: "A valid payment request key is required." }, { status: 400 });

  const { data: campaign, error: campaignError } = await actor.supabase
    .from("fundraising_campaigns")
    .select("id")
    .eq("id", payload?.campaign_id ?? "")
    .eq("status", "active")
    .maybeSingle();
  if (campaignError || !campaign) return NextResponse.json({ error: "That campaign is no longer accepting gifts." }, { status: 400 });

  const record = {
    id: crypto.randomUUID(),
    campaign_id: campaign.id,
    donor_id: actor.user?.id ?? null,
    donor_name: payload?.is_anonymous ? null : payload?.donor_name?.trim().slice(0, 160) || null,
    donor_email: email || null,
    receipt_email: email || null,
    is_anonymous: payload?.is_anonymous === true,
    recurring: payload?.recurring === true,
    consent_to_updates: payload?.consent_to_updates === true,
    amount: Math.round(amount * 100) / 100,
    currency,
    status: "pending",
    idempotency_key: idempotencyKey,
  };

  const { error } = await actor.supabase.from("donations").insert(record as never);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This payment attempt was already received. Please check your email before trying again." }, { status: 409 });
    return NextResponse.json({ error: "We could not save your gift intent. Please try again." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    donation_id: record.id,
    checkout_url: null,
    message: "Your gift intent is saved. Secure checkout will open when the payment provider is connected.",
  }, { status: 201 });
}
