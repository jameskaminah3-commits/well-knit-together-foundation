"use client";

import { useState } from "react";
import { supportStatuses } from "@/lib/support";

type CaseRecord = {
  id: string; county: string; beneficiary_group: string; need_category: string; urgency: string; description: string; status: string; assigned_to: string | null; contact_name: string | null; contact_email: string | null; contact_phone: string | null; consent_to_contact: boolean; safeguarding_concern: boolean; safeguarding_flag: boolean; safeguarding_summary: string | null; follow_up_at: string | null; closure_reason: string | null; created_at: string;
  notes: Array<{ id: string; note: string; created_at: string }>;
  referrals: Array<{ id: string; partner_name: string; referral_status: string; response_due_at: string | null }>;
};

export function SupportCaseManager({ initialCases }: { initialCases: CaseRecord[] }) {
  const [cases, setCases] = useState(initialCases);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function call(path: string, body: object) {
    setNotice(""); setError("");
    const response = await fetch(path, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) { setError(result?.error ?? "The case could not be updated."); return false; }
    setNotice("Case updated and logged."); return true;
  }
  async function updateCase(id: string, body: object) {
    if (await call(`/api/support/requests/${id}`, body)) {
      setCases((current) => current.map((item) => item.id === id ? { ...item, ...body, assigned_to: body && "assigned_to" in body && body.assigned_to === "me" ? "You" : item.assigned_to } as CaseRecord : item));
    }
  }
  async function addNote(id: string, note: string) {
    const response = await fetch(`/api/support/requests/${id}/notes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ note }) });
    if (!response.ok) { setError("The internal note could not be saved."); return; }
    setNotice("Internal note added and logged.");
  }
  async function addReferral(id: string, form: HTMLFormElement) {
    const data = new FormData(form);
    const response = await fetch(`/api/support/requests/${id}/referrals`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ partner_name: data.get("partner_name"), partner_contact: data.get("partner_contact"), response_due_at: data.get("response_due_at") || null }) });
    if (!response.ok) { setError("The referral could not be saved."); return; }
    form.reset(); setNotice("Referral added and case moved to referred.");
  }

  return <div className="case-workspace">{(notice || error) && <p className={`form-alert ${error ? "form-alert-error" : "form-alert-success"}`} role={error ? "alert" : "status"}>{error || notice}</p>}{cases.length ? cases.map((item) => <details className="case-card" key={item.id} open><summary><span><strong>{item.need_category.replaceAll("_", " ")}</strong><small>{item.county} · {item.urgency} · {new Date(item.created_at).toLocaleDateString()}</small></span><span className={`status-badge status-${item.status}`}>{item.status.replaceAll("_", " ")}</span></summary><div className="case-card-body"><p className="case-description">{item.description}</p><div className="case-meta"><span>Population: {item.beneficiary_group.replaceAll("_", " ")}</span><span>Reference: {item.id.slice(0, 8).toUpperCase()}</span><span>{item.consent_to_contact ? `Contact: ${item.contact_name || item.contact_phone || item.contact_email || "consented, details missing"}` : "No contact consent"}</span></div><div className="form-two-col"><label>Status<select value={item.status} onChange={(event) => updateCase(item.id, { status: event.target.value })}>{supportStatuses.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label><label>Follow-up date<input type="datetime-local" value={item.follow_up_at ? item.follow_up_at.slice(0, 16) : ""} onChange={(event) => updateCase(item.id, { follow_up_at: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label></div><div className="case-actions"><button className="button button-small" type="button" onClick={() => updateCase(item.id, { assigned_to: "me" })}>Assign to me</button><button className="button button-small button-secondary" type="button" onClick={() => updateCase(item.id, { assigned_to: null })}>Unassign</button></div><label className="checkbox-label"><input type="checkbox" checked={item.safeguarding_flag} onChange={(event) => updateCase(item.id, { safeguarding_flag: event.target.checked, safeguarding_summary: event.target.checked ? item.safeguarding_summary || "Review required" : null })} /> Mark for safeguarding review</label>{item.safeguarding_flag && <label>Safeguarding summary<textarea rows={3} defaultValue={item.safeguarding_summary || ""} onBlur={(event) => updateCase(item.id, { safeguarding_summary: event.target.value })} /></label>}<label>Closure reason<textarea rows={2} defaultValue={item.closure_reason || ""} onBlur={(event) => updateCase(item.id, { closure_reason: event.target.value })} /></label><div className="case-subforms"><form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const note = String(new FormData(form).get("note") || "").trim(); if (note) { void addNote(item.id, note); form.reset(); } }}><strong>Internal note</strong><textarea name="note" rows={3} placeholder="Only verified case staff can see this." required /><button className="button button-small" type="submit">Add note</button></form><form onSubmit={(event) => { event.preventDefault(); void addReferral(item.id, event.currentTarget); }}><strong>Referral partner</strong><input name="partner_name" placeholder="Partner name" required /><input name="partner_contact" placeholder="Partner contact (optional)" /><input name="response_due_at" type="date" /><button className="button button-small" type="submit">Record referral</button></form></div>{item.notes.length > 0 && <div className="case-history"><strong>Recent internal notes</strong>{item.notes.map((note) => <p key={note.id}><span>{new Date(note.created_at).toLocaleString()}</span>{note.note}</p>)}</div>}{item.referrals.length > 0 && <div className="case-history"><strong>Referrals</strong>{item.referrals.map((referral) => <p key={referral.id}><span>{referral.partner_name}</span>{referral.referral_status}{referral.response_due_at ? ` · due ${new Date(referral.response_due_at).toLocaleDateString()}` : ""}</p>)}</div>}</div></details>) : <div className="empty-state"><h3>No requests in this workspace.</h3><p className="muted">New public and assisted requests will appear here.</p></div>}</div>;
}
