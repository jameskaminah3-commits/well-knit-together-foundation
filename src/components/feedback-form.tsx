"use client";

import { FormEvent, useState } from "react";

export function FeedbackForm() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage(""); const formElement = event.currentTarget; const form = new FormData(formElement);
    const response = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ area: form.get("area"), rating: Number(form.get("rating")), message: form.get("message"), contact_email: form.get("contact_email"), consent_recorded: form.get("consent_recorded") === "on" }) });
    const result = await response.json().catch(() => null) as { error?: string; reference?: string } | null;
    if (!response.ok) setError(result?.error ?? "We could not save your feedback."); else { formElement.reset(); setMessage(`Thank you. Your feedback is safely recorded${result?.reference ? ` · ${result.reference}` : ""}.`); }
    setBusy(false);
  }
  return <form className="feedback-form content-form" onSubmit={submit}><div className="form-two-col"><label>What would you like to comment on?<select name="area" defaultValue="website" required><option value="website">The website</option><option value="support">Requesting support</option><option value="events">Events and learning</option><option value="marketplace">Marketplace</option><option value="giving">Giving</option><option value="workspace">The secure workspace</option><option value="other">Something else</option></select></label><label>How did it feel to use?<select name="rating" defaultValue="5" required><option value="5">5 · Very easy</option><option value="4">4 · Easy</option><option value="3">3 · In between</option><option value="2">2 · Difficult</option><option value="1">1 · Very difficult</option></select></label></div><label>What should we keep or improve?<textarea name="message" rows={6} minLength={10} maxLength={2000} required placeholder="A few words are enough. Plain language is welcome." /></label><label>Email (optional)<input type="email" name="contact_email" autoComplete="email" placeholder="Only if you would like a reply" /></label><label className="checkbox-label"><input type="checkbox" name="consent_recorded" required /> I consent to the foundation storing this feedback so the team can review and improve the service.</label>{error && <p className="form-alert form-alert-error" role="alert">{error}</p>}{message && <p className="form-alert form-alert-success" role="status">{message}</p>}<button className="button button-small" type="submit" disabled={busy}>{busy ? "Saving feedback…" : "Share feedback"}</button></form>;
}
