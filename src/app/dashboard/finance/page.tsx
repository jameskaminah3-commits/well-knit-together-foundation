import Link from "next/link";
import { OfflineGiftForm } from "@/components/offline-gift-form";
import { getAdminActor, hasFinanceAccess } from "@/lib/auth/admin-access";
import { formatMoney } from "@/lib/fundraising";
import { getGivingSettings, onlineGivingAvailable } from "@/lib/payments/settings";

export const metadata = { title: "Finance workspace" };
export const dynamic = "force-dynamic";

const methodLabels: Record<string, string> = { mpesa: "M-Pesa online", mpesa_paybill: "M-Pesa Paybill", mpesa_till: "M-Pesa Till", bank_transfer: "Bank transfer", cash: "Cash", cheque: "Cheque" };

export default async function FinancePage() {
  const actor = await getAdminActor();
  if (!hasFinanceAccess(actor.roles, actor.assuranceLevel)) return <section className="dashboard-page narrow-page"><p className="eyebrow">Finance workspace</p><h1>Verified finance access required.</h1><p className="lead muted">Funding records are restricted to finance users and administrators with a verified authenticator session.</p><Link className="button" href="/dashboard/security">Open security settings</Link></section>;
  const [{ data: donations }, { data: campaigns }, giving, online] = await Promise.all([
    actor.supabase.from("donations").select("id, amount, currency, status, donor_name, donor_email, is_anonymous, provider, provider_reference, receipt_number, failure_reason, created_at, campaign_id").order("created_at", { ascending: false }).limit(60),
    actor.supabase.from("fundraising_campaigns").select("id, title, goal_amount, raised_amount, currency, status").order("created_at", { ascending: false }),
    getGivingSettings(),
    onlineGivingAvailable(),
  ]);
  const rows = donations ?? [];
  const succeeded = rows.filter((donation) => donation.status === "succeeded");
  const pending = rows.filter((donation) => donation.status === "pending");
  const failed = rows.filter((donation) => donation.status === "failed");
  const campaignNames = new Map((campaigns ?? []).map((campaign) => [campaign.id, campaign.title]));
  const isSuperadmin = actor.roles.includes("superadmin");

  return <section className="dashboard-page">
    <div className="dashboard-heading"><div><p className="eyebrow">Finance</p><h1>Funding, reconciled.</h1><p className="lead muted">Every gift, receipt, and campaign total in one place. Online M-Pesa gifts are confirmed by Safaricom; gifts that arrive directly are recorded here.</p></div></div>
    <div className="finance-metrics">
      <article className="info-card"><p className="eyebrow">Confirmed gifts</p><h3>{formatMoney(succeeded.reduce((sum, donation) => sum + Number(donation.amount), 0))}</h3><p className="muted">{succeeded.length} gifts in the latest 60 records</p></article>
      <article className="info-card"><p className="eyebrow">Awaiting confirmation</p><h3>{pending.length}</h3><p className="muted">M-Pesa prompts not yet completed</p></article>
      <article className="info-card"><p className="eyebrow">Did not complete</p><h3>{failed.length}</h3><p className="muted">Cancelled, timed out, or failed</p></article>
    </div>

    <div className="dashboard-notice"><div><strong>Online giving is {online ? "on" : "off"}.</strong><p>{giving.mpesaPaybill ? `Donors see Paybill ${giving.mpesaPaybill}${giving.mpesaAccountReference ? `, account ${giving.mpesaAccountReference}` : ""}.` : "No Paybill is shown to donors yet."} {giving.bankName ? `Bank: ${giving.bankName}.` : ""} Payment settings are managed by the super administrator.</p></div>{isSuperadmin && <Link className="button button-small button-secondary" href="/dashboard/settings/payments">Payment settings</Link>}</div>

    <div className="finance-grid">
      <div>
        <div className="content-section-heading"><div><p className="eyebrow">Record a direct gift</p><h3>Paybill, bank, or cash</h3></div></div>
        <div className="settings-card"><p className="muted">Match each gift against the M-Pesa or bank statement first. Each M-Pesa code or bank reference can only be recorded once.</p><OfflineGiftForm campaigns={(campaigns ?? []).map((campaign) => ({ id: campaign.id, title: campaign.title, status: campaign.status }))} /></div>
        <div className="content-section-heading" style={{ marginTop: 28 }}><div><p className="eyebrow">Campaigns</p><h3>Progress against goals</h3></div></div>
        <div className="finance-campaign-list">{(campaigns ?? []).map((campaign) => <article className="finance-campaign" key={campaign.id}><div><strong>{campaign.title}</strong><span>{formatMoney(Number(campaign.raised_amount), campaign.currency)} of {formatMoney(Number(campaign.goal_amount), campaign.currency)} · {Math.round((Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100)}%</span></div><span className={`status-badge status-${campaign.status}`}>{campaign.status}</span></article>)}</div>
      </div>
      <div>
        <div className="content-section-heading"><div><p className="eyebrow">Latest activity</p><h3>Gift ledger</h3></div></div>
        <div className="finance-campaign-list">{rows.map((donation) => <article className="finance-campaign" key={donation.id}><div><strong>{donation.is_anonymous ? "Anonymous gift" : donation.donor_name || donation.donor_email || "Gift"}</strong><span>{formatMoney(Number(donation.amount), donation.currency)} · {methodLabels[donation.provider ?? ""] ?? "Not yet paid"}{donation.provider_reference ? ` · ${donation.provider_reference}` : ""}</span><span>{campaignNames.get(donation.campaign_id) ?? "General fund"} · {new Date(donation.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}{donation.receipt_number ? ` · ${donation.receipt_number}` : ""}</span>{donation.status === "failed" && donation.failure_reason && <span>{donation.failure_reason}</span>}</div><span className={`status-badge status-${donation.status}`}>{donation.status}</span></article>)}</div>
      </div>
    </div>
  </section>;
}
