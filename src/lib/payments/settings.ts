import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { directGiving } from "@/lib/site";
import { decryptSecret, encryptionConfigured, mpesaCallbackToken } from "@/lib/payments/crypto";
import type { MpesaCredentials } from "@/lib/payments/mpesa";

export type GivingSettings = {
  onlineCheckoutEnabled: boolean;
  mpesaPaybill: string | null;
  mpesaAccountReference: string | null;
  mpesaTill: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  bankSwift: string | null;
  givingNote: string | null;
  updatedAt: string | null;
  source: "database" | "environment";
};

type GivingRow = {
  online_checkout_enabled: boolean;
  mpesa_paybill: string | null;
  mpesa_account_reference: string | null;
  mpesa_till: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  bank_swift: string | null;
  giving_note: string | null;
  updated_at: string | null;
};

const givingColumns = "online_checkout_enabled, mpesa_paybill, mpesa_account_reference, mpesa_till, bank_name, bank_account_name, bank_account_number, bank_branch, bank_swift, giving_note, updated_at";

function fromEnvironment(): GivingSettings {
  return {
    onlineCheckoutEnabled: false,
    mpesaPaybill: directGiving.mpesaPaybill,
    mpesaAccountReference: directGiving.mpesaAccount,
    mpesaTill: directGiving.mpesaTill,
    bankName: directGiving.bankName,
    bankAccountName: directGiving.bankAccountName,
    bankAccountNumber: directGiving.bankAccountNumber,
    bankBranch: directGiving.bankBranch,
    bankSwift: directGiving.bankSwift,
    givingNote: null,
    updatedAt: null,
    source: "environment",
  };
}

/**
 * Giving details shown to donors. Values the superadmin saved in the database
 * win; any field left empty falls back to the NEXT_PUBLIC_* environment values.
 */
export async function getGivingSettings(): Promise<GivingSettings> {
  const fallback = fromEnvironment();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("giving_settings").select(givingColumns).eq("id", true).maybeSingle();
    const row = data as GivingRow | null;
    if (!row) return fallback;
    return {
      onlineCheckoutEnabled: row.online_checkout_enabled,
      mpesaPaybill: row.mpesa_paybill ?? fallback.mpesaPaybill,
      mpesaAccountReference: row.mpesa_account_reference ?? fallback.mpesaAccountReference,
      mpesaTill: row.mpesa_till ?? fallback.mpesaTill,
      bankName: row.bank_name ?? fallback.bankName,
      bankAccountName: row.bank_account_name ?? fallback.bankAccountName,
      bankAccountNumber: row.bank_account_number ?? fallback.bankAccountNumber,
      bankBranch: row.bank_branch ?? fallback.bankBranch,
      bankSwift: row.bank_swift ?? fallback.bankSwift,
      givingNote: row.giving_note,
      updatedAt: row.updated_at,
      source: "database",
    };
  } catch {
    return fallback;
  }
}

export function hasDirectGivingDetails(settings: GivingSettings) {
  return Boolean(settings.mpesaPaybill || settings.mpesaTill || (settings.bankName && settings.bankAccountNumber));
}

type CredentialRow = {
  environment: "sandbox" | "production";
  shortcode: string | null;
  transaction_type: MpesaCredentials["transactionType"];
  party_b: string | null;
  consumer_key_encrypted: string | null;
  consumer_secret_encrypted: string | null;
  passkey_encrypted: string | null;
  consumer_key_hint: string | null;
  last_verified_at: string | null;
  last_verification_error: string | null;
  updated_at: string | null;
};

export type CredentialStatus = {
  environment: "sandbox" | "production";
  shortcode: string | null;
  transactionType: MpesaCredentials["transactionType"];
  partyB: string | null;
  consumerKeyHint: string | null;
  hasConsumerKey: boolean;
  hasConsumerSecret: boolean;
  hasPasskey: boolean;
  lastVerifiedAt: string | null;
  lastVerificationError: string | null;
  updatedAt: string | null;
  source: "database" | "environment" | "none";
};

async function loadCredentialRow() {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("payment_provider_credentials").select("environment, shortcode, transaction_type, party_b, consumer_key_encrypted, consumer_secret_encrypted, passkey_encrypted, consumer_key_hint, last_verified_at, last_verification_error, updated_at").eq("provider", "mpesa").maybeSingle();
  return data as CredentialRow | null;
}

function environmentCredentials(): MpesaCredentials | null {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const passkey = process.env.MPESA_PASSKEY;
  const shortcode = process.env.MPESA_SHORTCODE;
  if (!consumerKey || !consumerSecret || !passkey || !shortcode) return null;
  const transactionType = process.env.MPESA_TRANSACTION_TYPE === "CustomerBuyGoodsOnline" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline";
  return { environment: process.env.MPESA_ENVIRONMENT === "production" ? "production" : "sandbox", shortcode, transactionType, partyB: process.env.MPESA_PARTY_B || shortcode, consumerKey, consumerSecret, passkey };
}

/** Decrypted credentials for server-side calls only. Never send these to a client. */
export async function getMpesaCredentials(): Promise<MpesaCredentials | null> {
  const row = await loadCredentialRow();
  if (row?.shortcode) {
    const consumerKey = decryptSecret(row.consumer_key_encrypted);
    const consumerSecret = decryptSecret(row.consumer_secret_encrypted);
    const passkey = decryptSecret(row.passkey_encrypted);
    if (consumerKey && consumerSecret && passkey) {
      return { environment: row.environment, shortcode: row.shortcode, transactionType: row.transaction_type, partyB: row.party_b || row.shortcode, consumerKey, consumerSecret, passkey };
    }
  }
  return environmentCredentials();
}

export async function getCredentialStatus(): Promise<CredentialStatus> {
  const row = await loadCredentialRow();
  if (row) {
    return {
      environment: row.environment,
      shortcode: row.shortcode,
      transactionType: row.transaction_type,
      partyB: row.party_b,
      consumerKeyHint: row.consumer_key_hint,
      hasConsumerKey: Boolean(row.consumer_key_encrypted),
      hasConsumerSecret: Boolean(row.consumer_secret_encrypted),
      hasPasskey: Boolean(row.passkey_encrypted),
      lastVerifiedAt: row.last_verified_at,
      lastVerificationError: row.last_verification_error,
      updatedAt: row.updated_at,
      source: "database",
    };
  }
  const env = environmentCredentials();
  return {
    environment: env?.environment ?? "sandbox",
    shortcode: env?.shortcode ?? null,
    transactionType: env?.transactionType ?? "CustomerPayBillOnline",
    partyB: env?.partyB ?? null,
    consumerKeyHint: env ? `…${env.consumerKey.slice(-4)}` : null,
    hasConsumerKey: Boolean(env),
    hasConsumerSecret: Boolean(env),
    hasPasskey: Boolean(env),
    lastVerifiedAt: null,
    lastVerificationError: null,
    updatedAt: null,
    source: env ? "environment" : "none",
  };
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function mpesaCallbackUrl() {
  const token = mpesaCallbackToken();
  return token ? `${siteUrl()}/api/payments/mpesa/callback/${token}` : null;
}

export type ReadinessCheck = { key: string; label: string; ok: boolean; help: string };

/** Everything that must be true before online giving can be switched on. */
export async function getPaymentReadiness() {
  const [credentials, status] = await Promise.all([getMpesaCredentials(), getCredentialStatus()]);
  const https = siteUrl().startsWith("https://");
  const checks: ReadinessCheck[] = [
    { key: "service", label: "Server key configured", ok: Boolean(createAdminClient()), help: "Set SUPABASE_SERVICE_ROLE_KEY on the server so payments can be reconciled." },
    { key: "encryption", label: "Encryption key configured", ok: encryptionConfigured(), help: "Set PAYMENT_ENCRYPTION_KEY (32+ random characters) on the server." },
    { key: "credentials", label: "M-Pesa Daraja credentials saved", ok: Boolean(credentials), help: "Save the shortcode, consumer key, consumer secret, and passkey below." },
    { key: "verified", label: "Connection tested", ok: Boolean(status.lastVerifiedAt) || status.source === "environment", help: "Use “Test connection” after saving credentials." },
    { key: "https", label: "Public HTTPS address", ok: https || process.env.NODE_ENV !== "production", help: "Safaricom only sends payment confirmations to an https:// NEXT_PUBLIC_SITE_URL." },
  ];
  return { checks, ready: checks.every((check) => check.ok), credentials, status };
}

/** True when donors can be charged online right now. */
export async function onlineGivingAvailable() {
  if (process.env.PAYMENTS_KILL_SWITCH === "true") return false;
  const settings = await getGivingSettings();
  if (!settings.onlineCheckoutEnabled) return false;
  const readiness = await getPaymentReadiness();
  return readiness.ready;
}

/** Marketplace orders are recorded and confirmed by the team; the superadmin's online switch opens them. */
export async function marketplaceOrdersOpen() {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.PAYMENTS_KILL_SWITCH === "true") return false;
  return (await getGivingSettings()).onlineCheckoutEnabled;
}
