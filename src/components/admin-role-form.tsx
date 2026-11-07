"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { roleLabels, staffRoles } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

export function AdminRoleForm({ userId, roles }: { userId: string; roles: AppRole[] }) {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>("content_editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(operation: "grant" | "revoke") {
    setBusy(true); setError("");
    const response = await fetch("/api/admin/roles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, role, operation }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Role update failed.");
    else router.refresh();
    setBusy(false);
  }

  return <div className="admin-role-controls"><select aria-label={`Role (current: ${roles.join(", ") || "none"})`} value={role} onChange={(event) => setRole(event.target.value as AppRole)}>{staffRoles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select><button className="button button-small" type="button" onClick={() => update("grant")} disabled={busy}>Grant</button><button className="button button-secondary button-small" type="button" onClick={() => update("revoke")} disabled={busy}>Revoke</button>{error && <span className="form-alert form-alert-error">{error}</span>}</div>;
}
