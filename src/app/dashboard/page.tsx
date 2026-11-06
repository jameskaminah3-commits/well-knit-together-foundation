import Link from "next/link";

export const metadata = { title: "Workspace" };

export default function DashboardPage() {
  return (
    <section className="section"><div className="container"><p className="eyebrow">Role-based workspace</p><h1>One secure home for the work behind the mission.</h1><p className="lead muted">This is the application boundary for staff, partners, volunteers, donors, and beneficiaries. Feature-specific dashboards will be added phase by phase.</p><div className="program-grid"><article className="program-card"><p className="eyebrow">Programs</p><h3>Support requests and referrals</h3><p>Private case and participation workflows will be visible only to authorised roles.</p></article><article className="program-card"><p className="eyebrow">Funding</p><h3>Donations and campaigns</h3><p>Finance users will manage reconciliation and approved reporting without exposing payment secrets.</p></article><article className="program-card"><p className="eyebrow">Commerce</p><h3>Products and orders</h3><p>Marketplace users will manage maker stories, inventory, fulfilment, and customer care.</p></article></div><p><Link className="button button-secondary" href="/">Back to public site</Link></p></div></section>
  );
}
