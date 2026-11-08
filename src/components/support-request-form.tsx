"use client";

import { FormEvent, useState } from "react";
import { beneficiaryGroups, needCategories, urgencyOptions } from "@/lib/support";

export function SupportRequestForm({ assisted = false }: { assisted?: boolean }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/support/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        beneficiary_group: form.get("beneficiary_group"),
        county: form.get("county"),
        need_category: form.get("need_category"),
        urgency: form.get("urgency"),
        description: form.get("description"),
        contact_name: form.get("contact_name"),
        contact_email: form.get("contact_email"),
        contact_phone: form.get("contact_phone"),
        preferred_contact_method: form.get("preferred_contact_method"),
        preferred_contact_window: form.get("preferred_contact_window"),
        consent_to_contact: contactConsent,
        safeguarding_concern: form.get("safeguarding_concern") === "on",
        submission_channel: assisted ? "assisted" : "web",
      }),
    });
    const result = await response.json().catch(() => null) as { error?: string; reference?: string } | null;
    if (!response.ok) setError(result?.error ?? "We could not save the request.");
    else { event.currentTarget.reset(); setContactConsent(false); setMessage(`Request received. Keep reference ${result?.reference ?? "provided"} for follow-up.`); }
    setBusy(false);
  }

  return <form className="content-form support-form" onSubmit={submit}>
    <div className="form-two-col">
      <label>Who is the request about?<select name="beneficiary_group" required defaultValue=""><option value="" disabled>Select one</option>{beneficiaryGroups.map((group) => <option value={group.value} key={group.value}>{group.label}</option>)}</select></label>
      <label>County<input name="county" maxLength={100} required placeholder="e.g. Kisumu" /></label>
    </div>
    <div className="form-two-col">
      <label>What kind of support is needed?<select name="need_category" defaultValue="other">{needCategories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Urgency<select name="urgency" defaultValue="normal">{urgencyOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    </div>
    <label>What would you like us to know?<textarea name="description" rows={6} minLength={10} maxLength={2000} required placeholder="Please share only what is needed for us to understand the request. Do not include passwords or financial account details." /></label>
    <div className="support-contact-box"><p className="eyebrow">Optional contact details</p><p className="form-note">We only use these details to respond to this request when you give consent. You can submit without identifying yourself.</p>
      <div className="form-two-col"><label>Name<input name="contact_name" maxLength={120} autoComplete="name" /></label><label>Phone<input name="contact_phone" maxLength={40} autoComplete="tel" /></label></div>
      <div className="form-two-col"><label>Email<input type="email" name="contact_email" maxLength={254} autoComplete="email" /></label><label>Best time to reach you<input name="preferred_contact_window" maxLength={120} placeholder="e.g. weekday afternoons" /></label></div>
      <label>Preferred contact method<select name="preferred_contact_method" defaultValue="none"><option value="none">No contact requested</option><option value="phone">Phone call</option><option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select></label>
      <label className="checkbox-label"><input type="checkbox" checked={contactConsent} onChange={(event) => setContactConsent(event.target.checked)} /> I consent to be contacted about this request.</label>
    </div>
    <label className="checkbox-label"><input type="checkbox" name="safeguarding_concern" /> There is an immediate safety or protection concern.</label>
    <p className="form-note">If someone is in immediate danger, contact local emergency services or a trusted person now. This form is not an emergency response line.</p>
    {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}{message && <p className="form-alert form-alert-success" role="status">{message}</p>}
    <button className="button button-small" type="submit" disabled={busy}>{busy ? "Sending securely…" : assisted ? "Create support case" : "Request support"}</button>
  </form>;
}
