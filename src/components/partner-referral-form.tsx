"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PartnerReferralForm({ referralId, status }: { referralId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [choice, setChoice] = useState(status === "accepted" ? "completed" : "accepted");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    const response = await fetch("/api/partner/referrals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ referralId, status: data.get("status"), outcome: data.get("outcome") }) }).catch(() => null);
    const result = await response?.json().catch(() => ({})) as { error?: string } | undefined;
    if (!response?.ok) setError(result?.error ?? "Could not update the referral.");
    else router.refresh();
    setBusy(false);
  }

  return <form className="inline-form" onSubmit={submit} style={{ marginTop: 10 }}>
    <select name="status" value={choice} onChange={(event) => setChoice(event.target.value)} aria-label="Response">
      {status === "pending" && <option value="accepted">Accept</option>}
      {status === "pending" && <option value="declined">Decline</option>}
      <option value="completed">Mark completed</option>
    </select>
    <input name="outcome" placeholder={choice === "accepted" ? "Optional note, e.g. visit booked" : "What happened? (required)"} style={{ flex: 1, minWidth: 180 }} />
    <button className="button button-small" disabled={busy}>{busy ? "Saving…" : "Update"}</button>
    {error && <span className="form-alert form-alert-error">{error}</span>}
  </form>;
}
