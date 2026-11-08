import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading"><div><p className="eyebrow">Role-based workspace</p><h1>Good to see you.</h1><p className="lead muted">This is the secure application boundary for the people behind the mission.</p></div><Link className="button button-secondary" href="/">View public site</Link></div>
      <div className="dashboard-notice"><div><strong>Phase 4 support workspace is active.</strong><p>Verified case staff can receive, triage, refer, follow up, and close private support requests.</p></div><Link className="text-link" href="/dashboard/security">Review security</Link></div>
      <div className="program-grid">
        <article className="program-card"><p className="eyebrow">Programs</p><h3>Support requests and referrals</h3><p>Private case and participation workflows are available to verified case staff.</p><Link className="card-link" href="/dashboard/support">Open case workspace →</Link></article>
        <article className="program-card"><p className="eyebrow">Funding</p><h3>Donations and campaigns</h3><p>Finance users will manage reconciliation and approved reporting without exposing payment secrets.</p><span className="card-status">Coming in Phase 5</span></article>
        <article className="program-card"><p className="eyebrow">Commerce</p><h3>Products and orders</h3><p>Marketplace users will manage maker stories, inventory, fulfilment, and customer care.</p><span className="card-status">Coming in Phase 6</span></article>
      </div>
      <p className="dashboard-session">Authenticated session for <strong>{user?.email}</strong></p>
    </section>
  );
}
