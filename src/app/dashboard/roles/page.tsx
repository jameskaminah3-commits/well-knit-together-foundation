import { getAdminActor } from "@/lib/auth/admin-access";
import { roleGuide, roleLabels } from "@/lib/roles";

export const metadata = { title: "Roles and permissions" };

export default async function RolesPage() {
  const actor = await getAdminActor();
  return (
    <section className="dashboard-page">
      <div className="dashboard-heading"><div><p className="eyebrow">Help</p><h1>Roles and permissions.</h1><p className="lead muted">Each person gets only the access their work needs. Staff roles require two-step verification. One person can hold more than one role—for example, a donor who also volunteers.</p></div></div>
      <div className="role-guide-grid">
        {roleGuide.map((guide) => (
          <article className={`role-guide-card${actor.roles.includes(guide.role) ? " role-current" : ""}`} key={guide.role} id={guide.role}>
            <div className="role-meta"><span className="role-chip">{roleLabels[guide.role]}</span>{actor.roles.includes(guide.role) && <span className="role-chip">Your role</span>}{guide.requiresMfa && <span className="role-chip role-chip-muted">Two-step verification</span>}</div>
            <p>{guide.summary}</p>
            <strong>Can</strong>
            <ul>{guide.canDo.map((item) => <li key={item}>{item}</li>)}</ul>
            <strong>Cannot</strong>
            <ul>{guide.cannotDo.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="form-note">Assigned by: {guide.assignedBy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
