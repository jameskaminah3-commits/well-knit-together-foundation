import { NextResponse } from "next/server";
import { getAdminActor, hasSuperadminAccess } from "@/lib/auth/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret, encryptionConfigured } from "@/lib/payments/crypto";
import { getAccessToken } from "@/lib/payments/mpesa";
import { getCredentialStatus, getMpesaCredentials, getPaymentReadiness } from "@/lib/payments/settings";

const optional = (value: unknown, max: number) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

async function requireSuperadmin() {
  const actor = await getAdminActor();
  if (!actor.user) return { actor, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!hasSuperadminAccess(actor.roles, actor.assuranceLevel)) return { actor, response: NextResponse.json({ error: "Only the super administrator, with a verified authenticator, can manage payment settings." }, { status: 403 }) };
  return { actor, response: null };
}

export async function GET() {
  const { response } = await requireSuperadmin();
  if (response) return response;
  const readiness = await getPaymentReadiness();
  return NextResponse.json({ checks: readiness.checks, ready: readiness.ready, credentials: readiness.status });
}

export async function PATCH(request: Request) {
  const { actor, response } = await requireSuperadmin();
  if (response) return response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.section !== "string") return NextResponse.json({ error: "Choose which settings to update." }, { status: 400 });

  if (body.section === "giving") {
    const fields = {
      mpesa_paybill: optional(body.mpesa_paybill, 7),
      mpesa_account_reference: optional(body.mpesa_account_reference, 12),
      mpesa_till: optional(body.mpesa_till, 8),
      bank_name: optional(body.bank_name, 120),
      bank_account_name: optional(body.bank_account_name, 160),
      bank_account_number: optional(body.bank_account_number, 40),
      bank_branch: optional(body.bank_branch, 120),
      bank_swift: typeof body.bank_swift === "string" ? optional(body.bank_swift.toUpperCase(), 11) : optional(body.bank_swift, 11),
      giving_note: optional(body.giving_note, 500),
    };
    if (fields.mpesa_paybill && !/^\d{5,7}$/.test(fields.mpesa_paybill)) return NextResponse.json({ error: "A Paybill number has 5 to 7 digits." }, { status: 400 });
    if (fields.mpesa_till && !/^\d{5,8}$/.test(fields.mpesa_till)) return NextResponse.json({ error: "A Till number has 5 to 8 digits." }, { status: 400 });
    if (fields.bank_swift && !/^[A-Z0-9]{8,11}$/.test(fields.bank_swift)) return NextResponse.json({ error: "A SWIFT code has 8 or 11 letters and numbers." }, { status: 400 });
    const update = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
    const { error } = await actor.supabase.from("giving_settings").update({ ...update, updated_by: actor.user!.id, updated_at: new Date().toISOString() }).eq("id", true).select("id").single();
    if (error) return NextResponse.json({ error: "The giving details could not be saved." }, { status: 400 });
    await actor.supabase.from("audit_logs").insert({ actor_id: actor.user!.id, action: "giving_settings_updated", entity_type: "giving_settings", metadata: { fields: Object.keys(update) } });
    return NextResponse.json({ ok: true });
  }

  if (body.section === "online") {
    const enabled = body.enabled === true;
    if (enabled) {
      const readiness = await getPaymentReadiness();
      if (!readiness.ready) return NextResponse.json({ error: `Finish setup first: ${readiness.checks.filter((check) => !check.ok).map((check) => check.label.toLowerCase()).join(", ")}.` }, { status: 400 });
    }
    const { error } = await actor.supabase.from("giving_settings").update({ online_checkout_enabled: enabled, updated_by: actor.user!.id, updated_at: new Date().toISOString() }).eq("id", true).select("id").single();
    if (error) return NextResponse.json({ error: "Online giving could not be updated." }, { status: 400 });
    await actor.supabase.from("audit_logs").insert({ actor_id: actor.user!.id, action: enabled ? "online_giving_enabled" : "online_giving_disabled", entity_type: "giving_settings", metadata: {} });
    return NextResponse.json({ ok: true, enabled });
  }

  if (body.section === "credentials") {
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: "Set SUPABASE_SERVICE_ROLE_KEY on the server first." }, { status: 503 });
    if (!encryptionConfigured()) return NextResponse.json({ error: "Set PAYMENT_ENCRYPTION_KEY (at least 32 characters) on the server before saving credentials." }, { status: 503 });
    const environment = body.environment === "production" ? "production" : "sandbox";
    const transactionType = body.transaction_type === "CustomerBuyGoodsOnline" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline";
    const shortcode = optional(body.shortcode, 8);
    const partyB = optional(body.party_b, 8);
    if (!shortcode || !/^\d{5,8}$/.test(shortcode)) return NextResponse.json({ error: "Enter the M-Pesa business shortcode (5 to 8 digits)." }, { status: 400 });
    if (transactionType === "CustomerBuyGoodsOnline" && (!partyB || !/^\d{5,8}$/.test(partyB))) return NextResponse.json({ error: "Buy Goods payments need the Till number that receives the money." }, { status: 400 });
    const secrets = { consumer_key: optional(body.consumer_key, 200), consumer_secret: optional(body.consumer_secret, 200), passkey: optional(body.passkey, 200) };
    const existing = await getCredentialStatus();
    // Saved secrets can be kept by leaving a field blank; the first save needs all three.
    const saved = existing.source === "database";
    const missing = [
      !secrets.consumer_key && !(saved && existing.hasConsumerKey) ? "consumer key" : null,
      !secrets.consumer_secret && !(saved && existing.hasConsumerSecret) ? "consumer secret" : null,
      !secrets.passkey && !(saved && existing.hasPasskey) ? "passkey" : null,
    ].filter(Boolean);
    if (missing.length) return NextResponse.json({ error: `Enter the ${missing.join(", ")}.` }, { status: 400 });
    const row: Record<string, unknown> = { provider: "mpesa", environment, transaction_type: transactionType, shortcode, party_b: transactionType === "CustomerBuyGoodsOnline" ? partyB : shortcode, updated_by: actor.user!.id, updated_at: new Date().toISOString(), last_verified_at: null, last_verification_error: null };
    if (secrets.consumer_key) { row.consumer_key_encrypted = encryptSecret(secrets.consumer_key); row.consumer_key_hint = `…${secrets.consumer_key.slice(-4)}`; }
    if (secrets.consumer_secret) row.consumer_secret_encrypted = encryptSecret(secrets.consumer_secret);
    if (secrets.passkey) row.passkey_encrypted = encryptSecret(secrets.passkey);
    const { error } = await admin.from("payment_provider_credentials").upsert(row, { onConflict: "provider" });
    if (error) return NextResponse.json({ error: "The credentials could not be saved." }, { status: 400 });
    // Changing credentials switches online giving off until they are tested again.
    await actor.supabase.from("giving_settings").update({ online_checkout_enabled: false, updated_by: actor.user!.id, updated_at: new Date().toISOString() }).eq("id", true);
    await actor.supabase.from("audit_logs").insert({ actor_id: actor.user!.id, action: "payment_credentials_updated", entity_type: "payment_provider_credentials", metadata: { environment, transaction_type: transactionType, shortcode, rotated: Object.entries(secrets).filter(([, value]) => value).map(([key]) => key) } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown settings section." }, { status: 400 });
}

/** Tests the saved credentials by requesting a Daraja access token. */
export async function POST() {
  const { actor, response } = await requireSuperadmin();
  if (response) return response;
  const admin = createAdminClient();
  const credentials = await getMpesaCredentials();
  if (!credentials) return NextResponse.json({ error: "Save the M-Pesa credentials first." }, { status: 400 });
  try {
    await getAccessToken(credentials);
    await admin?.from("payment_provider_credentials").update({ last_verified_at: new Date().toISOString(), last_verification_error: null }).eq("provider", "mpesa");
    await actor.supabase.from("audit_logs").insert({ actor_id: actor.user!.id, action: "payment_credentials_verified", entity_type: "payment_provider_credentials", metadata: { environment: credentials.environment } });
    return NextResponse.json({ ok: true, message: `Connected to M-Pesa ${credentials.environment}.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed.";
    await admin?.from("payment_provider_credentials").update({ last_verified_at: null, last_verification_error: message.slice(0, 300) }).eq("provider", "mpesa");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
