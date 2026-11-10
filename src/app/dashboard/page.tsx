import Link from "next/link";
import { getAdminActor, hasAdminRole } from "@/lib/auth/admin-access";
import type { AppRole } from "@/types/domain";

type Tile = { eyebrow: string; title: string; description: string; href: string; cta: string; roles?: AppRole[] };

const tiles: Tile[] = [
  { eyebrow: "Support", title: "Support cases", description: "Triage, refer, follow up, and close private support requests.", href: "/dashboard/support", cta: "Open case workspace", roles: ["program_manager"] },
  { eyebrow: "Funding", title: "Finance", description: "Reconcile gifts, campaigns, and receipts.", href: "/dashboard/finance", cta: "Open finance", roles: ["finance"] },
  { eyebrow: "Community", title: "Engagement", description: "Review volunteers and partners, manage events and attendance.", href: "/dashboard/engagement", cta: "Open engagement", roles: ["program_manager", "marketplace_manager"] },
  { eyebrow: "Evidence", title: "Reporting & measurement", description: "Record indicator data and approve public impact figures.", href: "/dashboard/reporting", cta: "Open reporting", roles: ["program_manager", "finance"] },
  { eyebrow: "Content", title: "Content studio", description: "Draft, review, and publish programs, stories, news, and reports.", href: "/dashboard/content", cta: "Open content studio", roles: ["content_editor"] },
  { eyebrow: "Partners", title: "Partner workspace", description: "Shared referrals, due diligence, and reporting with the foundation.", href: "/dashboard/partner", cta: "Open partner workspace", roles: ["partner"] },
  { eyebrow: "Giving", title: "My giving", description: "Your gifts, receipts, and campaign history.", href: "/dashboard/giving", cta: "View my giving", roles: ["donor"] },
  { eyebrow: "Support", title: "My support requests", description: "Check the status of requests you have made while signed in.", href: "/support/requests", cta: "View my requests" },
  { eyebrow: "Shop", title: "My orders", description: "Track marketplace orders and delivery.", href: "/dashboard/orders", cta: "View my orders" },
];

export default async function DashboardPage() {
  const actor = await getAdminActor();
  const isAdmin = hasAdminRole(actor.roles);
  const visible = tiles.filter((tile) => !tile.roles || isAdmin || tile.roles.some((role) => actor.roles.includes(role)));
  const isStaff = actor.roles.some((role) => ["superadmin", "admin", "program_manager", "finance", "marketplace_manager", "content_editor"].includes(role));
  const verified = actor.assuranceLevel === "aal2";

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading"><div><p className="eyebrow">Your workspace</p><h1>Good to see you.</h1><p className="lead muted">Everything you have access to, in one place.</p></div><Link className="button button-secondary" href="/">View public site</Link></div>
      {isStaff && !verified && <div className="dashboard-notice"><div><strong>Turn on two-step verification to open staff tools.</strong><p>Case records, finance, and publishing require an authenticator app for your protection and the people we serve.</p></div><Link className="text-link" href="/dashboard/security">Set up security</Link></div>}
      <div className="program-grid">
        {visible.map((tile) => <article className="program-card" key={tile.href}><p className="eyebrow">{tile.eyebrow}</p><h3>{tile.title}</h3><p>{tile.description}</p><Link className="card-link" href={tile.href}>{tile.cta} →</Link></article>)}
      </div>
      <p className="dashboard-session">Signed in as <strong>{actor.user?.email}</strong></p>
    </section>
  );
}
