import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminInviteForm } from "@/components/admin-invite-form";
import { AdminRoleForm } from "@/components/admin-role-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminActor, hasAdminAccess, hasAdminRole } from "@/lib/auth/admin-access";
import { roleLabels } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

export const metadata = { title: "Administration" };

export default async function AdminPage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/admin");
  if (!hasAdminRole(actor.roles)) redirect("/dashboard");

  if (!hasAdminAccess(actor.roles, actor.assuranceLevel)) {
    return <section className="dashboard-page narrow-page"><p className="eyebrow">Administration</p><h1>Authenticator verification required.</h1><p className="lead muted">Role administration is protected by MFA. Verify an authenticator factor before managing staff access.</p><Link className="button" href="/dashboard/security">Open security settings</Link></section>;
  }

  const admin = createAdminClient();
  if (!admin) return <section className="dashboard-page narrow-page"><p className="eyebrow">Administration</p><h1>Server setup required.</h1><p className="lead muted">The server-only Supabase service key is not configured. Add it to the deployment environment before enabling staff invitations.</p></section>;

  const [{ data: userData, error: usersError }, { data: roleRows }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 100 }),
    admin.from("user_roles").select("user_id, role"),
  ]);
  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of roleRows ?? []) rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role as AppRole]);
  const users = (userData?.users ?? []).map((user) => ({ id: user.id, email: user.email ?? "No email", name: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "Unnamed account", roles: rolesByUser.get(user.id) ?? [] }));

  return <section className="dashboard-page narrow-page"><div className="dashboard-heading"><div><p className="eyebrow">Administration</p><h1>People and access.</h1><p className="lead muted">Invite staff through a controlled path and review role assignments without exposing service credentials to the browser.</p></div></div><div className="info-card admin-panel"><p className="eyebrow">Invite staff</p><h3>Start with a verified email</h3><p>Invited staff receive a Supabase verification email. Their role is limited to the selected operational area.</p><AdminInviteForm /></div><div className="admin-list"><div className="admin-list-heading"><div><p className="eyebrow">Access directory</p><h3>Accounts and roles</h3></div><span className="form-note">{users.length} accounts</span></div>{usersError && <p className="form-alert form-alert-error">Could not load accounts: {usersError.message}</p>}{users.map((user) => <article className="admin-user-row" key={user.id}><div><strong>{user.name}</strong><span>{user.email}</span><div className="role-list">{user.roles.length ? user.roles.map((role) => <span className="role-chip" key={role}>{roleLabels[role]}</span>) : <span className="role-chip role-chip-muted">No assigned role</span>}</div></div><AdminRoleForm userId={user.id} roles={user.roles} /></article>)}</div></section>;
}
