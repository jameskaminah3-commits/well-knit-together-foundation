"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { communityRoles, roleLabels, staffRoles } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

type Option = { id: string; organization_name?: string; name?: string; email?: string };

export function AdminRoleForm({ userId, roles, canManageSuperadmin, partnerApplications, volunteerApplications }: { userId: string; roles: AppRole[]; canManageSuperadmin: boolean; partnerApplications: Option[]; volunteerApplications: Option[] }) {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>("donor");
  const [linkId, setLinkId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const staffChoices = staffRoles.filter((item) => item !== "superadmin" || canManageSuperadmin);
  const linkOptions = role === "partner" ? partnerApplications : role === "volunteer" ? volunteerApplications : [];

  async function update(operation: "grant" | "revoke") {
    if (operation === "grant" && role === "partner" && !linkId) { setError("Choose the approved partner organisation this person belongs to."); return; }
    setBusy(true); setError("");
    const response = await fetch("/api/admin/roles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, role, operation, linkApplicationId: linkId || undefined }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Role update failed.");
    else { setLinkId(""); router.refresh(); }
    setBusy(false);
  }

  return <div className="admin-role-controls">
    <select aria-label={`Role (current: ${roles.join(", ") || "none"})`} value={role} onChange={(event) => { setRole(event.target.value as AppRole); setLinkId(""); }}>
      <optgroup label="Community">{communityRoles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</optgroup>
      <optgroup label="Staff (two-step verification required)">{staffChoices.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</optgroup>
    </select>
    {linkOptions.length > 0 && <select aria-label="Link to an approved application" value={linkId} onChange={(event) => setLinkId(event.target.value)}><option value="">{role === "partner" ? "Choose organisation…" : "Link volunteer application (optional)…"}</option>{linkOptions.map((option) => <option key={option.id} value={option.id}>{option.organization_name ?? `${option.name} · ${option.email}`}</option>)}</select>}
    {role === "partner" && !partnerApplications.length && <span className="form-note">Approve a partner application in Engagement first.</span>}
    <button className="button button-small" type="button" onClick={() => update("grant")} disabled={busy}>Grant</button>
    <button className="button button-secondary button-small" type="button" onClick={() => update("revoke")} disabled={busy}>Revoke</button>
    {error && <span className="form-alert form-alert-error">{error}</span>}
  </div>;
}
