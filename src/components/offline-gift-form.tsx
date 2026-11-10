"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OfflineGiftForm({ campaigns }: { campaigns: Array<{ id: string; title: string; status: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [method, setMethod] = useState("mpesa_paybill");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement));
    setBusy(true); setNotice(""); setError("");
    try {
      const response = await fetch("/api/finance/offline-gifts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({})) as { error?: string; receipt_number?: string };
      if (!response.ok) setError(result.error ?? "The gift could not be recorded.");
      else { formElement.reset(); setMethod("mpesa_paybill"); setNotice(`Gift recorded${result.receipt_number ? ` · receipt ${result.receipt_number}` : ""}. The campaign total has been updated.`); router.refresh(); }
    } catch {
      setError("You appear to be offline. Nothing was saved.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="content-form settings-form" onSubmit={submit}>
    <div className="form-two-col">
      <label>Received by<select name="method" value={method} onChange={(event) => setMethod(event.target.value)}><option value="mpesa_paybill">M-Pesa Paybill</option><option value="mpesa_till">M-Pesa Till</option><option value="bank_transfer">Bank transfer</option><option value="cheque">Cheque</option><option value="cash">Cash</option></select></label>
      <label>Amount (KES)<input name="amount" type="number" min="1" step="0.01" required /></label>
    </div>
    <div className="form-two-col">
      <label>{method.startsWith("mpesa") ? "M-Pesa code" : method === "cash" ? "Reference (optional)" : "Bank or cheque reference"}<input name="reference" required={method !== "cash"} placeholder={method.startsWith("mpesa") ? "e.g. SKB4R7T2QA" : ""} /></label>
      <label>Date received<input name="received_on" type="date" /></label>
    </div>
    <div className="form-two-col">
      <label>Donor name (leave blank if anonymous)<input name="donor_name" /></label>
      <label>Email for receipt (optional)<input name="receipt_email" type="email" /></label>
    </div>
    <label>Campaign<select name="campaign_id" defaultValue=""><option value="">General fund</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}{campaign.status !== "active" ? ` (${campaign.status})` : ""}</option>)}</select></label>
    {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
    {notice && <p className="form-alert form-alert-success" role="status">{notice}</p>}
    <button className="button button-small" type="submit" disabled={busy}>{busy ? "Recording…" : "Record gift and issue receipt"}</button>
  </form>;
}
