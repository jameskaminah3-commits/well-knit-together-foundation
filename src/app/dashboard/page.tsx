import Link from "next/link";
import { getAdminActor, hasAdminRole } from "@/lib/auth/admin-access";
import { communityRoles, roleGuide, roleLabels, staffRoles } from "@/lib/roles";
import type { AppRole } from "@/types/domain";

type Tile = { eyebrow: string; title: string; description: string; href: string; cta: string; roles?: AppRole[] };

const tiles: Tile[] = [
  { eyebrow: "Support", title: "Support cases", description: "Triage, refer, follow up, and close private support requests.", href: "/dashboard/support", cta: "Open case workspace", roles: ["program_manager"] },
  { eyebrow: "Community", title: "Engagement", description: "Partners, volunteers, events, attendance, and in-app updates.", href: "/dashboard/engagement", cta: "Open engagement", roles: ["program_manager", "marketplace_manager"] },
  { eyebrow: "Evidence", title: "Reporting", description: "Record indicator data and approve public impact figures.", href: "/dashboard/reporting", cta: "Open reporting", roles: ["program_manager", "finance"] },
  { eyebrow: "Stories", title: "Content studio", description: "Draft, translate, and submit content for publication.", href: "/dashboard/content", cta: "Open content studio", roles: ["content_editor"] },
  { eyebrow: "Shop", title: "Shop", description: "Products, stock, prices, and order fulfilment.", href: "/dashboard/shop", cta: "Open shop", roles: ["marketplace_manager", "finance"] },
  { eyebrow: "Funding", title: "Finance", description: "Gifts, receipts, campaign totals, and offline gifts.", href: "/dashboard/finance", cta: "Open finance", roles: ["finance"] },
  { eyebrow: "People", title: "Administration", description: "Staff access, community roles, and the activity log.", href: "/dashboard/admin", cta: "Open administration", roles: ["admin"] },
  { eyebrow: "Payments", title: "Payment settings", description: "Paybill, bank details, M-Pesa connection, and online giving.", href: "/dashboard/settings/payments", cta: "Open payment settings", roles: ["superadmin"] },
  { eyebrow: "Partners", title: "Partner workspace", description: "Programmes and referrals shared with your organisation.", href: "/dashboard/partner", cta: "Open partner workspace", roles: ["partner"] },
  { eyebrow: "Volunteering", title: "My volunteering", description: "Your applications, assignments, and upcoming events.", href: "/dashboard/volunteer", cta: "View my volunteering", roles: ["volunteer"] },
  { eyebrow: "Support", title: "My support requests", description: "Follow the status of requests you made while signed in.", href: "/support/requests", cta: "View my requests" },
  { eyebrow: "Giving", title: "My giving", description: "Your gifts and receipt numbers.", href: "/dashboard/giving", cta: "View my giving" },
  { eyebrow: "Shop", title: "My orders", description: "Track your orders and delivery.", href: "/dashboard/orders", cta: "View my orders" },
];

export default async function DashboardPage() {
  const actor = await getAdminActor();
  const isAdmin = hasAdminRole(actor.roles);
  const isSuperadmin = actor.roles.includes("superadmin");
  const hasAny = (roles: AppRole[]) => roles.some((role) => actor.roles.includes(role));
  const visible = tiles.filter((tile) => {
    if (!tile.roles) return true;
    if (tile.roles.includes("superadmin")) return isSuperadmin;
    if (tile.roles.every((role) => communityRoles.includes(role))) return hasAny(tile.roles);
    return isAdmin || hasAny(tile.roles);
  });
  const isStaff = actor.roles.some((role) => staffRoles.includes(role));
  const verified = actor.assuranceLevel === "aal2";
  const myGuides = roleGuide.filter((guide) => actor.roles.includes(guide.role));
  const { data: notifications } = await actor.supabase.from("engagement_notifications").select("id, title, body, created_at").eq("status", "sent").order("created_at", { ascending: false }).limit(4);
  const name = typeof actor.user?.user_metadata?.display_name === "string" ? actor.user.user_metadata.display_name.split(" ")[0] : null;

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading"><div><p className="eyebrow">Your workspace</p><h1>{name ? `Karibu, ${name}.` : "Good to see you."}</h1><p className="lead muted">Everything you have access to, in one place.</p></div><Link className="button button-secondary" href="/">View public site</Link></div>
      {isStaff && !verified && (actor.canVerify
        ? <div className="dashboard-notice"><div><strong>Verify this session to open staff tools.</strong><p>Enter the code from your authenticator app. Staff tools stay locked until you do.</p></div><Link className="button button-small" href="/auth/verify?next=/dashboard">Verify now</Link></div>
        : <div className="dashboard-notice"><div><strong>Turn on two-step verification to open staff tools.</strong><p>Case records, finance, publishing, and payment settings require an authenticator app—for your protection and for the people we serve.</p></div><Link className="button button-small" href="/dashboard/security">Set up security</Link></div>)}

      <div className="role-guide-grid">
        {myGuides.length ? myGuides.map((guide) => <article className="role-guide-card role-current" key={guide.role}><div className="role-meta"><span className="role-chip">{roleLabels[guide.role]}</span>{guide.requiresMfa && <span className="role-chip role-chip-muted">Needs two-step verification</span>}</div><h3>What you can do</h3><p className="muted">{guide.summary}</p><ul>{guide.canDo.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul></article>)
          : <article className="role-guide-card"><span className="role-chip role-chip-muted">Supporter</span><h3>Welcome to the circle</h3><p className="muted">You can follow your gifts, orders, and support requests here. If you work with the foundation, an administrator can give you access to the right tools.</p></article>}
      </div>

      <div className="program-grid" style={{ marginTop: 28 }}>
        {visible.map((tile) => <article className="program-card" key={tile.href}><p className="eyebrow">{tile.eyebrow}</p><h3>{tile.title}</h3><p>{tile.description}</p><Link className="card-link" href={tile.href}>{tile.cta} →</Link></article>)}
      </div>

      {notifications?.length ? <div style={{ marginTop: 34 }}><div className="content-section-heading"><div><p className="eyebrow">Updates for you</p><h3>From the foundation</h3></div></div><div className="notification-inbox">{notifications.map((item) => <article key={item.id}><strong>{item.title}</strong><p className="muted">{item.body}</p><small>{new Date(item.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}</small></article>)}</div></div> : null}
      <p className="dashboard-session">Signed in as <strong>{actor.user?.email}</strong> · <Link className="text-link" href="/dashboard/roles">How roles work</Link></p>
    </section>
  );
}
