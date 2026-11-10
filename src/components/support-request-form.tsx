"use client";

import { FormEvent, useRef, useState } from "react";
import { beneficiaryGroups, needCategories, servedCounties, urgencyOptions } from "@/lib/support";

function Bilingual({ en, sw }: { en: string; sw: string }) {
  return <>{en} <span className="field-hint" lang="sw">· {sw}</span></>;
}

export function SupportRequestForm({ assisted = false }: { assisted?: boolean }) {
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);
  const [county, setCounty] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const contactName = String(form.get("contact_name") ?? "").trim();
    const contactPhone = String(form.get("contact_phone") ?? "").trim();
    const contactEmail = String(form.get("contact_email") ?? "").trim();
    const method = String(form.get("preferred_contact_method") ?? "none");
    const gaveContactDetails = Boolean(contactName || contactPhone || contactEmail);

    if (gaveContactDetails && !contactConsent) {
      setError("You added contact details. Tick “I consent to be contacted” so we can reply, or clear the details to stay anonymous.");
      return;
    }
    if (contactConsent && method === "none") {
      setError("Choose how you would like us to contact you.");
      return;
    }
    if (contactConsent && (method === "phone" || method === "sms" || method === "whatsapp") && !contactPhone) {
      setError("Add a phone number so we can reach you by phone, SMS, or WhatsApp.");
      return;
    }
    if (contactConsent && method === "email" && !contactEmail) {
      setError("Add an email address so we can reply by email.");
      return;
    }

    const countyValue = county === "other" ? String(form.get("county_other") ?? "").trim() : county;
    if (!countyValue) {
      setError("Tell us which county you are in.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          beneficiary_group: form.get("beneficiary_group"),
          county: countyValue,
          need_category: form.get("need_category"),
          urgency: form.get("urgency"),
          description: form.get("description"),
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          preferred_contact_method: method,
          preferred_contact_window: form.get("preferred_contact_window"),
          consent_to_contact: contactConsent,
          safeguarding_concern: form.get("safeguarding_concern") === "on",
          submission_channel: assisted ? "assisted" : "web",
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string; reference?: string } | null;
      if (!response.ok) {
        setError(result?.error ?? "We could not send your request. Please try again.");
        return;
      }
      formElement.reset();
      setContactConsent(false);
      setCounty("");
      setReference(result?.reference ?? "Received");
      requestAnimationFrame(() => { successRef.current?.focus({ preventScroll: true }); successRef.current?.scrollIntoView({ block: "center" }); });
    } catch {
      setError("You appear to be offline. Your request has not been sent—please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <div className="success-panel" role="status" tabIndex={-1} ref={successRef}>
        <h4>{assisted ? "Support case created." : "Thank you. Your request is with our team."}</h4>
        <p>Your reference number · <span lang="sw">Namba ya kumbukumbu</span>:</p>
        <p><span className="success-reference">{reference}</span></p>
        <p>Please write this number down or take a screenshot. If you gave consent to be contacted, a team member will reach you using the method you chose. If someone is in danger, call 999 or 112 now.</p>
        <p lang="sw">Ombi lako limepokelewa. Hifadhi namba hii. Tutawasiliana nawe ukiruhusu.</p>
        <button className="button button-small button-secondary" type="button" onClick={() => setReference("")}>{assisted ? "Create another case" : "Send another request"}</button>
      </div>
    );
  }

  return <form className="content-form support-form" onSubmit={submit}>
    <div className="form-two-col">
      <label><Bilingual en="Who is the request about?" sw="Ombi linamhusu nani?" /><select name="beneficiary_group" required defaultValue=""><option value="" disabled>Select one · Chagua</option>{beneficiaryGroups.map((group) => <option value={group.value} key={group.value}>{group.label}</option>)}</select></label>
      <label><Bilingual en="County" sw="Kaunti" /><select name="county_select" required value={county} onChange={(event) => setCounty(event.target.value)}><option value="" disabled>Select county · Chagua kaunti</option>{servedCounties.map((name) => <option value={name} key={name}>{name}</option>)}<option value="other">Another county · Kaunti nyingine</option></select></label>
    </div>
    {county === "other" && <label><Bilingual en="Which county?" sw="Kaunti gani?" /><input name="county_other" maxLength={100} required autoComplete="address-level1" /></label>}
    <div className="form-two-col">
      <label><Bilingual en="What support is needed?" sw="Msaada gani unahitajika?" /><select name="need_category" defaultValue="caregiving">{needCategories.map(([value, label, sw]) => <option value={value} key={value}>{label} · {sw}</option>)}</select></label>
      <label><Bilingual en="How urgent is it?" sw="Ni ya dharura kiasi gani?" /><select name="urgency" defaultValue="normal">{urgencyOptions.map(([value, label, sw]) => <option value={value} key={value}>{label} · {sw}</option>)}</select></label>
    </div>
    <label><Bilingual en="Tell us what is happening" sw="Tueleze hali ilivyo" /><textarea name="description" rows={6} minLength={10} maxLength={2000} required placeholder="You can write in English or Kiswahili. Share only what we need to understand the request. · Unaweza kuandika kwa Kiswahili." /></label>
    <div className="support-contact-box"><p className="eyebrow">How can we reach you? · Tukufikie vipi?</p><p className="form-note">Optional. We use these details only to respond to this request, and only if you tick the consent box. You can also send the request without your name.</p>
      <div className="form-two-col"><label><Bilingual en="Name" sw="Jina" /><input name="contact_name" maxLength={120} autoComplete="name" /></label><label><Bilingual en="Phone" sw="Simu" /><input name="contact_phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" placeholder="07XX XXX XXX" /></label></div>
      <div className="form-two-col"><label><Bilingual en="Email" sw="Barua pepe" /><input type="email" name="contact_email" maxLength={254} autoComplete="email" /></label><label><Bilingual en="Best time to reach you" sw="Wakati mzuri" /><input name="preferred_contact_window" maxLength={120} placeholder="e.g. weekday afternoons" /></label></div>
      <label><Bilingual en="Preferred contact method" sw="Njia unayopendelea" /><select name="preferred_contact_method" defaultValue="phone"><option value="phone">Phone call · Simu</option><option value="sms">SMS · Ujumbe mfupi</option><option value="whatsapp">WhatsApp</option><option value="email">Email · Barua pepe</option><option value="none">Please do not contact me · Msiniwasiliane</option></select></label>
      <label className="checkbox-label"><input type="checkbox" checked={contactConsent} onChange={(event) => setContactConsent(event.target.checked)} /> <span>I consent to be contacted about this request. <span className="field-hint" lang="sw">· Nakubali mniwasiliane kuhusu ombi hili.</span></span></label>
    </div>
    <label className="checkbox-label"><input type="checkbox" name="safeguarding_concern" /> <span>There is an immediate safety or protection concern. <span className="field-hint" lang="sw">· Kuna hatari ya usalama sasa hivi.</span></span></label>
    <p className="form-note">This form is not an emergency line. If someone is in danger now, call <a href="tel:999">999</a> or <a href="tel:112">112</a>. For a child at risk call Childline on <a href="tel:116">116</a>.</p>
    {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
    <button className="button button-full" type="submit" disabled={busy}>{busy ? "Sending securely… · Inatuma…" : assisted ? "Create support case" : "Send request · Tuma ombi"}</button>
  </form>;
}
