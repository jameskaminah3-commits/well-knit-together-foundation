"use client";

import { useState } from "react";

type Preferences = {
  event_updates: boolean;
  support_updates: boolean;
  giving_updates: boolean;
  marketplace_updates: boolean;
  impact_updates: boolean;
  marketing_opt_in: boolean;
};

const options: Array<{ key: keyof Preferences; label: string; description: string }> = [
  { key: "event_updates", label: "Events and learning", description: "Registration reminders, schedule changes, and useful follow-up." },
  { key: "support_updates", label: "Support updates", description: "Updates about support requests where you have asked to be contacted by email." },
  { key: "giving_updates", label: "Giving updates", description: "Receipts and important updates about gifts you make." },
  { key: "marketplace_updates", label: "Marketplace updates", description: "Order and fulfilment updates for purchases you make." },
  { key: "impact_updates", label: "Impact and learning", description: "Occasional evidence of what the community is building together." },
  { key: "marketing_opt_in", label: "News and invitations", description: "Optional news, invitations, and ways to stay connected." },
];

export function EmailPreferencesForm({ initial }: { initial: Preferences }) {
  const [preferences, setPreferences] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setMessage(""); setError("");
    const response = await fetch("/api/account/email-preferences", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(preferences) });
    const result = await response.json().catch(() => null) as { error?: string; preferences?: Preferences } | null;
    if (!response.ok) setError(result?.error ?? "We could not save your preferences.");
    else { if (result?.preferences) setPreferences(result.preferences); setMessage("Your email preferences are saved."); }
    setBusy(false);
  }

  return <div className="preference-form"><div className="preference-list">{options.map((option) => <label className="preference-row" key={option.key}><input type="checkbox" checked={preferences[option.key]} onChange={(event) => setPreferences((current) => ({ ...current, [option.key]: event.target.checked }))} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div>{error && <p className="form-alert form-alert-error" role="alert">{error}</p>}{message && <p className="form-alert form-alert-success" role="status">{message}</p>}<button className="button button-small" type="button" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save preferences"}</button><p className="form-note">Security, account, receipt, and support messages will still be sent when they are necessary to provide a service you requested.</p></div>;
}
