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

  const [{ data: userData, error: usersError }, { data: roleRows }, { data: partnerApplications }, { data: volunteerApplications }, { data: activity }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("user_roles").select("user_id, role"),
    admin.from("partner_applications").select("id, organization_name").eq("status", "approved").order("organization_name"),
    admin.from("volunteer_applications").select("id, name, email").eq("status", "approved").order("name"),
    admin.from("audit_logs").select("id, actor_id, action, entity_type, metadata, created_at").order("created_at", { ascending: false }).limit(25),
  ]);
  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of roleRows ?? []) rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role as AppRole]);
  const users = (userData?.users ?? []).map((user) => ({ id: user.id, email: user.email ?? "No email", name: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "Unnamed account", roles: rolesByUser.get(user.id) ?? [] }));
  const emailById = new Map(users.map((user) => [user.id, user.name !== "Unnamed account" ? user.name : user.email]));
  const isSuperadmin = actor.roles.includes("superadmin");
  const describe = (action: string) => action.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());

  return <section className="dashboard-page narrow-page">
    <div className="dashboard-heading"><div><p className="eyebrow">Administration</p><h1>People and access.</h1><p className="lead muted">Invite staff, give community members the right access, and see who changed what. Service credentials never reach the browser.</p></div></div>
    <div className="info-card admin-panel"><p className="eyebrow">Invite staff</p><h3>Start with a verified email</h3><p>Invited staff receive a verification email. Their access is limited to the role you choose, and staff tools stay locked until they set up two-step verification.</p><AdminInviteForm canInviteSuperadmin={isSuperadmin} /></div>
    <div className="admin-list"><div className="admin-list-heading"><div><p className="eyebrow">Access directory</p><h3>Accounts and roles</h3></div><span className="form-note">{users.length} accounts</span></div>
      {usersError && <p className="form-alert form-alert-error">Could not load accounts: {usersError.message}</p>}
      {users.map((user) => <article className="admin-user-row" key={user.id}><div><strong>{user.name}</strong><span>{user.email}</span><div className="role-list">{user.roles.length ? user.roles.map((role) => <span className="role-chip" key={role}>{roleLabels[role]}</span>) : <span className="role-chip role-chip-muted">Supporter (no role)</span>}</div></div>{user.id === actor.user!.id ? <span className="form-note">This is you</span> : <AdminRoleForm userId={user.id} roles={user.roles} canManageSuperadmin={isSuperadmin} partnerApplications={partnerApplications ?? []} volunteerApplications={volunteerApplications ?? []} />}</article>)}
    </div>
    <div className="admin-list"><div className="admin-list-heading"><div><p className="eyebrow">Activity log</p><h3>Recent changes</h3></div><Link className="text-link" href="/dashboard/roles">Role guide</Link></div>
      {(activity ?? []).length ? <div className="table-scroll"><table className="workspace-table"><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>{(activity ?? []).map((entry) => <tr key={entry.id}><td>{new Date(entry.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" })}</td><td>{entry.actor_id ? emailById.get(entry.actor_id) ?? "Staff member" : "System"}</td><td>{describe(entry.action)}<br /><small className="muted">{entry.entity_type}</small></td></tr>)}</tbody></table></div> : <div className="empty-state"><p className="muted">No activity recorded yet.</p></div>}
    </div>
  </section>;
}
