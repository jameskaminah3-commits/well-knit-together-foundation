"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Check = { key: string; label: string; ok: boolean; help: string };
type Giving = { mpesaPaybill: string | null; mpesaAccountReference: string | null; mpesaTill: string | null; bankName: string | null; bankAccountName: string | null; bankAccountNumber: string | null; bankBranch: string | null; bankSwift: string | null; givingNote: string | null };
type Credentials = { environment: "sandbox" | "production"; shortcode: string | null; transactionType: string; partyB: string | null; consumerKeyHint: string | null; hasConsumerKey: boolean; hasConsumerSecret: boolean; hasPasskey: boolean; lastVerifiedAt: string | null; lastVerificationError: string | null; source: string };

async function call(method: string, body?: object) {
  const response = await fetch("/api/admin/payment-settings", { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) throw new Error(result.error ?? "The change could not be saved.");
  return result;
}

export function PaymentSettingsPanel({ enabled, checks, giving, credentials, callbackUrl }: { enabled: boolean; checks: Check[]; giving: Giving; credentials: Credentials; callbackUrl: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [transactionType, setTransactionType] = useState(credentials.transactionType);
  const ready = checks.every((check) => check.ok);

  async function run(action: () => Promise<{ message?: string }>, success: string) {
    setBusy(true); setNotice(""); setError("");
    try { const result = await action(); setNotice(result.message ?? success); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "The change could not be saved."); }
    finally { setBusy(false); }
  }

  function saveGiving(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    void run(() => call("PATCH", { section: "giving", ...data }), "Giving details saved. The donate page now shows them.");
  }

  function saveCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement));
    void run(async () => { const result = await call("PATCH", { section: "credentials", ...data }); formElement.querySelectorAll<HTMLInputElement>("input[type=password]").forEach((input) => { input.value = ""; }); return result; }, "Credentials encrypted and saved. Test the connection before switching online giving on.");
  }

  return (
    <div className="settings-stack">
      {(notice || error) && <p className={`form-alert ${error ? "form-alert-error" : "form-alert-success"}`} role={error ? "alert" : "status"}>{error || notice}</p>}

      <section className="settings-card">
        <div className="settings-card-heading"><div><p className="eyebrow">Online giving</p><h2>M-Pesa on the donate page</h2><p className="muted">When this is on, donors enter their phone number and approve the gift with their M-Pesa PIN. Receipts are issued automatically after Safaricom confirms payment.</p></div><span className={`status-badge ${enabled ? "status-published" : ""}`}>{enabled ? "On" : "Off"}</span></div>
        <ul className="readiness-list">{checks.map((check) => <li key={check.key} className={check.ok ? "ready" : "pending"}><span aria-hidden="true">{check.ok ? "✓" : "•"}</span><div><strong>{check.label}</strong>{!check.ok && <small>{check.help}</small>}</div></li>)}</ul>
        <div className="button-row">
          {enabled ? <button className="button button-secondary" type="button" disabled={busy} onClick={() => void run(() => call("PATCH", { section: "online", enabled: false }), "Online giving is off. Donors now see Paybill and bank details.")}>Switch online giving off</button>
            : <button className="button" type="button" disabled={busy || !ready} onClick={() => void run(() => call("PATCH", { section: "online", enabled: true }), "Online giving is on.")}>Switch online giving on</button>}
          <button className="button button-secondary" type="button" disabled={busy || !(credentials.hasConsumerKey && credentials.hasConsumerSecret && credentials.hasPasskey)} onClick={() => void run(() => call("POST"), "Connection works.")}>Test connection</button>
        </div>
        {credentials.lastVerificationError && <p className="form-note">Last test failed: {credentials.lastVerificationError}</p>}
      </section>

      <section className="settings-card">
        <div className="settings-card-heading"><div><p className="eyebrow">Shown to donors</p><h2>Giving details</h2><p className="muted">These appear on the donate page so supporters can give by Paybill, Till, or bank transfer at any time. Use only accounts registered in the foundation’s name.</p></div></div>
        <form className="content-form settings-form" onSubmit={saveGiving}>
          <div className="form-two-col"><label>M-Pesa Paybill number<input name="mpesa_paybill" inputMode="numeric" defaultValue={giving.mpesaPaybill ?? ""} placeholder="e.g. 123456" /></label><label>Account reference<input name="mpesa_account_reference" maxLength={12} defaultValue={giving.mpesaAccountReference ?? ""} placeholder="e.g. DONATION" /></label></div>
          <label>M-Pesa Till number (Buy Goods)<input name="mpesa_till" inputMode="numeric" defaultValue={giving.mpesaTill ?? ""} placeholder="Optional" /></label>
          <div className="form-two-col"><label>Bank<input name="bank_name" defaultValue={giving.bankName ?? ""} /></label><label>Branch<input name="bank_branch" defaultValue={giving.bankBranch ?? ""} /></label></div>
          <div className="form-two-col"><label>Account name<input name="bank_account_name" defaultValue={giving.bankAccountName ?? ""} /></label><label>Account number<input name="bank_account_number" defaultValue={giving.bankAccountNumber ?? ""} /></label></div>
          <label>SWIFT code (for gifts from abroad)<input name="bank_swift" defaultValue={giving.bankSwift ?? ""} placeholder="Optional" /></label>
          <label>Note for donors<textarea name="giving_note" rows={2} maxLength={500} defaultValue={giving.givingNote ?? ""} placeholder="Optional, e.g. how to request a receipt for a bank transfer" /></label>
          <button className="button button-small" type="submit" disabled={busy}>Save giving details</button>
        </form>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading"><div><p className="eyebrow">Safaricom Daraja</p><h2>M-Pesa Express credentials</h2><p className="muted">From the Daraja portal for the foundation’s shortcode. Secrets are encrypted before they are stored and are never shown again. Leave a secret blank to keep the saved value.</p></div><span className="status-badge">{credentials.source === "database" ? "Saved" : credentials.source === "environment" ? "From server environment" : "Not set"}</span></div>
        <form className="content-form settings-form" onSubmit={saveCredentials}>
          <div className="form-two-col">
            <label>Environment<select name="environment" defaultValue={credentials.environment}><option value="sandbox">Sandbox (testing)</option><option value="production">Production (real money)</option></select></label>
            <label>Payment type<select name="transaction_type" value={transactionType} onChange={(event) => setTransactionType(event.target.value)}><option value="CustomerPayBillOnline">Paybill</option><option value="CustomerBuyGoodsOnline">Till (Buy Goods)</option></select></label>
          </div>
          <div className="form-two-col">
            <label>Business shortcode<input name="shortcode" inputMode="numeric" required defaultValue={credentials.shortcode ?? ""} /></label>
            {transactionType === "CustomerBuyGoodsOnline" ? <label>Till number that receives payment<input name="party_b" inputMode="numeric" required defaultValue={credentials.partyB ?? ""} /></label> : <span />}
          </div>
          <label>Consumer key<input name="consumer_key" type="password" autoComplete="off" placeholder={credentials.hasConsumerKey ? `Saved ${credentials.consumerKeyHint ?? ""} · leave blank to keep` : "Required"} /></label>
          <label>Consumer secret<input name="consumer_secret" type="password" autoComplete="off" placeholder={credentials.hasConsumerSecret ? "Saved · leave blank to keep" : "Required"} /></label>
          <label>Passkey<input name="passkey" type="password" autoComplete="off" placeholder={credentials.hasPasskey ? "Saved · leave blank to keep" : "Required"} /></label>
          <p className="form-note">Saving new credentials switches online giving off until you test the connection again.</p>
          <button className="button button-small" type="submit" disabled={busy}>Encrypt and save credentials</button>
        </form>
        {callbackUrl && <p className="form-note">Safaricom will confirm payments to <code>{callbackUrl.replace(/callback\/.+$/, "callback/•••")}</code>. No registration is needed for M-Pesa Express.</p>}
      </section>
    </div>
  );
}
