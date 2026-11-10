import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Server-only helpers for payment secrets. Secrets are encrypted with
 * AES-256-GCM using a key derived from PAYMENT_ENCRYPTION_KEY before they are
 * stored, and are never returned to the browser.
 */
function key() {
  const secret = process.env.PAYMENT_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) return null;
  return createHash("sha256").update(secret).digest();
}

export function encryptionConfigured() {
  return key() !== null;
}

export function encryptSecret(plain: string) {
  const derived = key();
  if (!derived) throw new Error("PAYMENT_ENCRYPTION_KEY must be set (at least 32 characters) before saving payment credentials.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derived, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(stored: string | null | undefined) {
  if (!stored) return null;
  const derived = key();
  if (!derived) return null;
  const [version, iv, tag, data] = stored.split(".");
  if (version !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", derived, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Unguessable path segment for the M-Pesa callback URL (Daraja does not sign callbacks). */
export function mpesaCallbackToken() {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.PAYMENT_ENCRYPTION_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update("mpesa-callback-v1").digest("hex").slice(0, 40);
}

export function tokensMatch(supplied: string, expected: string) {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
