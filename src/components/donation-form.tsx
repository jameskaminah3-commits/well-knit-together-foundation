"use client";

import { FormEvent, useState } from "react";
import { donationAmounts, formatMoney } from "@/lib/fundraising-shared";

export function DonationForm({ campaignId, currency }: { campaignId: string; currency: string }) {
  const [amount, setAmount] = useState("1000");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [updates, setUpdates] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/donations/intent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({
        campaign_id: campaignId,
        amount: Number(amount),
        currency,
        donor_email: email,
        donor_name: anonymous ? "" : name,
        is_anonymous: anonymous,
        recurring,
        consent_to_updates: updates,
      }),
    });
    const payload = await response.json().catch(() => null) as { error?: string; message?: string; checkout_url?: string } | null;
    if (!response.ok) setError(payload?.error ?? "We could not prepare your gift. Please try again.");
    else setMessage(payload?.message ?? (payload?.checkout_url ? "Your secure checkout is ready." : "Your gift intent is saved. Secure checkout will open when the payment provider is connected."));
    setBusy(false);
  }

  return (
    <form className="donation-form" onSubmit={submit}>
      <div className="donation-form-heading"><div><p className="eyebrow">Choose your gift</p><h3>Every contribution creates room to care.</h3></div><span className="donation-currency">{currency}</span></div>
      <div className="amount-grid" aria-label="Suggested amounts">
        {donationAmounts.map((value) => <button className={String(value) === amount ? "amount-option amount-option-active" : "amount-option"} type="button" key={value} onClick={() => setAmount(String(value))}>{formatMoney(value, currency)}</button>)}
      </div>
      <label>Custom amount<input inputMode="decimal" min="50" step="50" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
      <div className="form-two-col"><label>Email for receipt<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.org" /></label><label>Name (optional)<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" disabled={anonymous} /></label></div>
      <label className="checkbox-label"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> Give anonymously</label>
      <label className="checkbox-label"><input type="checkbox" checked={recurring} onChange={(event) => setRecurring(event.target.checked)} /> Make this a monthly gift</label>
      <label className="checkbox-label"><input type="checkbox" checked={updates} onChange={(event) => setUpdates(event.target.checked)} /> Send me approved updates about the impact of giving</label>
      {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
      {message && <p className="form-alert form-alert-success" role="status">{message}</p>}
      <button className="button button-full" type="submit" disabled={busy}>{busy ? "Preparing secure checkout…" : `Continue with ${formatMoney(Number(amount) || 0, currency)}`}</button>
      <p className="form-note">We never store raw card details. Payment status, provider reference, and receipt delivery are reconciled server-side.</p>
    </form>
  );
}
