"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { donationAmounts, formatMoney } from "@/lib/fundraising-shared";

type Phase = "idle" | "submitting" | "awaiting" | "succeeded" | "failed" | "timeout" | "recorded";

const POLL_INTERVAL_MS = 3000;
const POLL_LIMIT_MS = 120_000;

export function DonationForm({ campaignId, currency, online }: { campaignId: string; currency: string; online: boolean }) {
  const [amount, setAmount] = useState("1000");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [updates, setUpdates] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);
  useEffect(() => { if (phase !== "idle" && phase !== "submitting") statusRef.current?.focus(); }, [phase]);

  function poll(donationId: string, startedAt: number) {
    pollTimer.current = setTimeout(async () => {
      const response = await fetch(`/api/donations/${donationId}/status`, { cache: "no-store" }).catch(() => null);
      const result = await response?.json().catch(() => null) as { status?: string; failure_reason?: string; receipt_number?: string } | null;
      if (result?.status === "succeeded") { setReceipt(result.receipt_number ?? ""); setPhase("succeeded"); return; }
      if (result?.status === "failed") { setError(result.failure_reason ?? "The payment was not completed."); setPhase("failed"); return; }
      if (Date.now() - startedAt > POLL_LIMIT_MS) { setPhase("timeout"); return; }
      poll(donationId, startedAt);
    }, POLL_INTERVAL_MS);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhase("submitting");
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/donations/intent", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ campaign_id: campaignId, amount: Number(amount), currency, phone, donor_email: email, donor_name: anonymous ? "" : name, is_anonymous: anonymous, consent_to_updates: updates }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; message?: string; donation_id?: string; checkout?: string | null } | null;
      if (!response.ok || !payload?.donation_id) { setError(payload?.error ?? "We could not start your gift. Please try again."); setPhase("idle"); return; }
      setMessage(payload.message ?? "");
      if (payload.checkout === "mpesa_stk") { setPhase("awaiting"); poll(payload.donation_id, Date.now()); }
      else setPhase("recorded");
    } catch {
      setError("You appear to be offline. Nothing was charged—please check your connection and try again.");
      setPhase("idle");
    }
  }

  function reset() {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setPhase("idle"); setMessage(""); setError(""); setReceipt("");
  }

  const amountLabel = formatMoney(Number(amount) || 0, currency);

  if (phase === "awaiting" || phase === "succeeded" || phase === "failed" || phase === "timeout" || phase === "recorded") {
    return (
      <div className="donation-form donation-status" ref={statusRef} tabIndex={-1} role="status" aria-live="polite">
        {phase === "awaiting" && <><div className="donation-spinner" aria-hidden="true" /><h3>Check your phone.</h3><p>We sent an M-Pesa prompt for <strong>{amountLabel}</strong>. Enter your M-Pesa PIN to complete your gift.</p><p className="form-note">This page will update on its own. The prompt expires after about a minute.</p></>}
        {phase === "succeeded" && <><p className="eyebrow">Asante sana</p><h3>Thank you. Your gift of {amountLabel} is confirmed.</h3>{receipt && <p>Receipt number: <strong>{receipt}</strong></p>}<p className="form-note">{email ? `We have emailed your receipt to ${email}.` : "Keep your M-Pesa confirmation SMS as your record."}</p></>}
        {phase === "failed" && <><h3>The payment did not go through.</h3><p>{error}</p><p className="form-note">Nothing was taken from your M-Pesa. You can try again, or use the Paybill details below.</p></>}
        {phase === "timeout" && <><h3>We have not heard back yet.</h3><p>If you entered your PIN, M-Pesa will send you a confirmation SMS and we will email a receipt if you gave an address. If you did not see a prompt, you can try again.</p></>}
        {phase === "recorded" && <><h3>Gift recorded.</h3><p>{message}</p></>}
        {phase !== "succeeded" && phase !== "awaiting" && <button className="button button-full" type="button" onClick={reset}>Try again</button>}
        {phase === "succeeded" && <button className="button button-secondary button-full" type="button" onClick={reset}>Give again</button>}
      </div>
    );
  }

  return (
    <form className="donation-form" onSubmit={submit}>
      <div className="donation-form-heading"><div><p className="eyebrow">{online ? "Give with M-Pesa" : "Choose your gift"}</p><h3>Every contribution creates room to care.</h3></div><span className="donation-currency">{currency}</span></div>
      <div className="amount-grid" role="group" aria-label="Suggested amounts">
        {donationAmounts.map((value) => <button aria-pressed={String(value) === amount} className={String(value) === amount ? "amount-option amount-option-active" : "amount-option"} type="button" key={value} onClick={() => setAmount(String(value))}>{formatMoney(value, currency)}</button>)}
      </div>
      <label>Amount (KES)<input inputMode="numeric" min="50" max="250000" step="1" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
      {online && <label>M-Pesa phone number<input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" required /><span className="field-hint">We will send a payment prompt to this number. You enter your PIN on your phone—never on this website.</span></label>}
      <div className="form-two-col"><label>Email for receipt (optional)<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.org" autoComplete="email" /></label><label>Name (optional)<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" disabled={anonymous} autoComplete="name" /></label></div>
      <label className="checkbox-label"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> Give anonymously</label>
      <label className="checkbox-label"><input type="checkbox" checked={updates} onChange={(event) => setUpdates(event.target.checked)} /> Send me occasional updates about what my gift made possible</label>
      {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
      <button className="button button-full" type="submit" disabled={phase === "submitting"}>{phase === "submitting" ? "Sending M-Pesa prompt…" : online ? `Give ${amountLabel} with M-Pesa` : `Continue with ${amountLabel}`}</button>
      <p className="form-note">We never see your M-Pesa PIN or card details. Gifts are confirmed by Safaricom before a receipt is issued.</p>
    </form>
  );
}
