"use client";

import { FormEvent, useState } from "react";
import type { EngagementEvent } from "@/lib/engagement";

function FormFeedback({ error, message }: { error: string; message: string }) {
  return <>{error && <p className="form-alert form-alert-error" role="alert">{error}</p>}{message && <p className="form-alert form-alert-success" role="status">{message}</p>}</>;
}

export function PartnerApplicationForm() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage(""); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/engagement/partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organization_name: form.get("organization_name"), contact_name: form.get("contact_name"), contact_email: form.get("contact_email"), focus_area: form.get("focus_area"), counties: form.get("counties"), notes: form.get("notes"), consent_recorded: form.get("consent_recorded") === "on" }) });
    const result = await response.json().catch(() => null) as { error?: string; reference?: string } | null;
    if (!response.ok) setError(result?.error ?? "We could not save the application."); else { event.currentTarget.reset(); setMessage(`Application received${result?.reference ? ` · ${result.reference}` : ""}. Our team will review the fit and follow up.`); }
    setBusy(false);
  }
  return <form className="content-form engagement-form" onSubmit={submit}><div className="form-two-col"><label>Organisation name<input name="organization_name" required maxLength={160} /></label><label>Contact name<input name="contact_name" required maxLength={120} /></label></div><div className="form-two-col"><label>Contact email<input type="email" name="contact_email" required maxLength={254} /></label><label>Counties or communities<input name="counties" required placeholder="e.g. Kisumu, Siaya" /></label></div><label>Focus area<select name="focus_area" defaultValue=""><option value="" disabled>Select one</option><option>Care and support</option><option>Economic opportunity</option><option>Inclusion and accessibility</option><option>Learning and training</option><option>Other community work</option></select></label><label>Tell us what a useful partnership could hold<textarea name="notes" rows={6} required minLength={20} maxLength={2000} /></label><label className="checkbox-label"><input type="checkbox" name="consent_recorded" required /> I consent to the foundation storing these details to review this partnership application.</label><FormFeedback error={error} message={message} /><button className="button button-small" type="submit" disabled={busy}>{busy ? "Sending application…" : "Submit partnership interest"}</button></form>;
}

export function VolunteerApplicationForm() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage(""); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/engagement/volunteer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), county: form.get("county"), skills: form.get("skills"), availability: form.get("availability"), consent_recorded: form.get("consent_recorded") === "on" }) });
    const result = await response.json().catch(() => null) as { error?: string; reference?: string } | null;
    if (!response.ok) setError(result?.error ?? "We could not save the application."); else { event.currentTarget.reset(); setMessage(`Volunteer interest received${result?.reference ? ` · ${result.reference}` : ""}. We’ll be in touch when a suitable opportunity opens.`); }
    setBusy(false);
  }
  return <form className="content-form engagement-form" onSubmit={submit}><div className="form-two-col"><label>Name<input name="name" required maxLength={120} autoComplete="name" /></label><label>Email<input type="email" name="email" required maxLength={254} autoComplete="email" /></label></div><div className="form-two-col"><label>County<input name="county" maxLength={100} placeholder="Where are you based?" /></label><label>Availability<input name="availability" required maxLength={200} placeholder="e.g. two Saturdays a month" /></label></div><label>Skills or interests<textarea name="skills" rows={5} required minLength={10} maxLength={1000} placeholder="Tell us what you enjoy contributing." /></label><label className="checkbox-label"><input type="checkbox" name="consent_recorded" required /> I consent to the foundation storing these details to review volunteer opportunities.</label><FormFeedback error={error} message={message} /><button className="button button-small" type="submit" disabled={busy}>{busy ? "Sending interest…" : "Share volunteer interest"}</button></form>;
}

export function EventRegistrationForm({ event }: { event: EngagementEvent }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  async function submit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault(); setBusy(true); setError(""); setMessage(""); const form = new FormData(eventForm.currentTarget);
    const response = await fetch("/api/engagement/events/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event_id: event.id, name: form.get("name"), email: form.get("email") }) });
    const result = await response.json().catch(() => null) as { error?: string; status?: string } | null;
    if (!response.ok) setError(result?.error ?? "We could not complete registration."); else { eventForm.currentTarget.reset(); setMessage(result?.status === "waitlisted" ? "You’re on the waitlist. We’ll contact you if a place opens." : "You’re registered. We’ll send the practical joining details to your email."); }
    setBusy(false);
  }
  return <form className="event-registration-form" onSubmit={submit}><p className="eyebrow">Reserve a place</p><h3>Join this gathering.</h3><div className="form-two-col"><label>Name<input name="name" required autoComplete="name" /></label><label>Email<input type="email" name="email" required autoComplete="email" /></label></div><FormFeedback error={error} message={message} /><button className="button button-full" type="submit" disabled={busy}>{busy ? "Registering…" : "Register for this event"}</button></form>;
}
