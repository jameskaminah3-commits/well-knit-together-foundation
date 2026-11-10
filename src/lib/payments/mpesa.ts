/**
 * Safaricom Daraja client for M-Pesa Express (STK Push).
 * https://developer.safaricom.co.ke — OAuth, STK Push, and STK Push Query.
 */

export type MpesaCredentials = {
  environment: "sandbox" | "production";
  shortcode: string;
  transactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
  partyB: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
};

export function darajaBaseUrl(environment: MpesaCredentials["environment"]) {
  const override = process.env.MPESA_API_BASE_URL;
  if (override) return override.replace(/\/$/, "");
  return environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
}

/** Normalises Kenyan mobile numbers to 2547XXXXXXXX / 2541XXXXXXXX. */
export function normalizeKenyanPhone(input: string) {
  const digits = input.replace(/[^\d]/g, "");
  let normalized = digits;
  if (/^0[17]\d{8}$/.test(digits)) normalized = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) normalized = `254${digits}`;
  return /^254[17]\d{8}$/.test(normalized) ? normalized : null;
}

export function maskPhone(phone: string) {
  return `${phone.slice(0, 6)}***${phone.slice(-3)}`;
}

/** Daraja expects the timestamp in East Africa Time as YYYYMMDDHHmmss. */
export function darajaTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

function stkPassword(credentials: MpesaCredentials, timestamp: string) {
  return Buffer.from(`${credentials.shortcode}${credentials.passkey}${timestamp}`).toString("base64");
}

async function darajaFetch(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

export async function getAccessToken(credentials: MpesaCredentials) {
  const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString("base64");
  const response = await darajaFetch(`${darajaBaseUrl(credentials.environment)}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  const body = await response.json().catch(() => null) as { access_token?: string; errorMessage?: string } | null;
  if (!response.ok || !body?.access_token) throw new Error(body?.errorMessage ?? `M-Pesa authentication failed (${response.status}). Check the consumer key and secret.`);
  return body.access_token;
}

export type StkPushResult = { checkoutRequestId: string; merchantRequestId: string; customerMessage: string };

export async function initiateStkPush(credentials: MpesaCredentials, input: { phone: string; amount: number; accountReference: string; description: string; callbackUrl: string }): Promise<StkPushResult> {
  const token = await getAccessToken(credentials);
  const timestamp = darajaTimestamp();
  const response = await darajaFetch(`${darajaBaseUrl(credentials.environment)}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: credentials.shortcode,
      Password: stkPassword(credentials, timestamp),
      Timestamp: timestamp,
      TransactionType: credentials.transactionType,
      Amount: Math.round(input.amount),
      PartyA: input.phone,
      PartyB: credentials.partyB,
      PhoneNumber: input.phone,
      CallBackURL: input.callbackUrl,
      AccountReference: input.accountReference.slice(0, 12),
      TransactionDesc: input.description.slice(0, 13),
    }),
  });
  const body = await response.json().catch(() => null) as { ResponseCode?: string; CheckoutRequestID?: string; MerchantRequestID?: string; CustomerMessage?: string; errorMessage?: string } | null;
  if (!response.ok || body?.ResponseCode !== "0" || !body.CheckoutRequestID) throw new Error(body?.errorMessage ?? body?.CustomerMessage ?? `M-Pesa could not start the payment (${response.status}).`);
  return { checkoutRequestId: body.CheckoutRequestID, merchantRequestId: body.MerchantRequestID ?? "", customerMessage: body.CustomerMessage ?? "" };
}

export type StkQueryResult = { state: "succeeded" | "failed" | "pending"; resultCode?: string; resultDesc?: string };

export async function queryStkPush(credentials: MpesaCredentials, checkoutRequestId: string): Promise<StkQueryResult> {
  const token = await getAccessToken(credentials);
  const timestamp = darajaTimestamp();
  const response = await darajaFetch(`${darajaBaseUrl(credentials.environment)}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ BusinessShortCode: credentials.shortcode, Password: stkPassword(credentials, timestamp), Timestamp: timestamp, CheckoutRequestID: checkoutRequestId }),
  });
  const body = await response.json().catch(() => null) as { ResultCode?: string | number; ResultDesc?: string; errorCode?: string; errorMessage?: string } | null;
  if (!body || body.ResultCode === undefined) return { state: "pending", resultDesc: body?.errorMessage };
  const code = String(body.ResultCode);
  return { state: code === "0" ? "succeeded" : "failed", resultCode: code, resultDesc: body.ResultDesc };
}

export type StkCallback = { merchantRequestId: string; checkoutRequestId: string; resultCode: number; resultDesc: string; amount?: number; receiptNumber?: string; phone?: string };

export function parseStkCallback(payload: unknown): StkCallback | null {
  const callback = (payload as { Body?: { stkCallback?: Record<string, unknown> } } | null)?.Body?.stkCallback;
  if (!callback || typeof callback.CheckoutRequestID !== "string") return null;
  const items = ((callback.CallbackMetadata as { Item?: Array<{ Name: string; Value?: string | number }> } | undefined)?.Item ?? []);
  const value = (name: string) => items.find((item) => item.Name === name)?.Value;
  return {
    merchantRequestId: String(callback.MerchantRequestID ?? ""),
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: Number(callback.ResultCode),
    resultDesc: String(callback.ResultDesc ?? ""),
    amount: value("Amount") !== undefined ? Number(value("Amount")) : undefined,
    receiptNumber: value("MpesaReceiptNumber") !== undefined ? String(value("MpesaReceiptNumber")) : undefined,
    phone: value("PhoneNumber") !== undefined ? String(value("PhoneNumber")) : undefined,
  };
}
