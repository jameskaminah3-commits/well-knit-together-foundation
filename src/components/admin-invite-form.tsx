"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { staffRoles, roleLabels } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

export function AdminInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("content_editor");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/admin/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Invitation failed.");
    else { setMessage("Invitation sent and role assigned."); setEmail(""); router.refresh(); }
    setBusy(false);
  }

  return <form className="admin-form" onSubmit={submit}><div><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="colleague@example.org" /></label></div><div><label>Staff role<select value={role} onChange={(event) => setRole(event.target.value as AppRole)}>{staffRoles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select></label></div><button className="button button-small" type="submit" disabled={busy}>{busy ? "Sending…" : "Send invite"}</button>{error && <p className="form-alert form-alert-error" role="alert">{error}</p>}{message && <p className="form-alert form-alert-success" role="status">{message}</p>}</form>;
}
