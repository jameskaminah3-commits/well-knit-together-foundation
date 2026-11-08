import Link from "next/link";
import { getAdminActor } from "@/lib/auth/admin-access";
import { formatMoney } from "@/lib/fundraising";

export const metadata = { title: "My giving" };

export default async function GivingPage() {
  const actor = await getAdminActor();
  const { data: donations } = actor.user ? await actor.supabase.from("donations").select("id, amount, currency, status, recurring, is_anonymous, created_at, receipt_number, campaign_id").eq("donor_id", actor.user.id).order("created_at", { ascending: false }) : { data: [] };
  const campaignIds = [...new Set((donations ?? []).map((item) => item.campaign_id).filter(Boolean))];
  const { data: campaigns } = campaignIds.length ? await actor.supabase.from("fundraising_campaigns").select("id, title").in("id", campaignIds) : { data: [] };
  const campaignNames = new Map((campaigns ?? []).map((campaign) => [campaign.id, campaign.title]));

  return <section className="dashboard-page narrow-page"><div className="dashboard-heading"><div><p className="eyebrow">Your giving</p><h1>A record of your generosity.</h1><p className="lead muted">Keep your contribution history, campaign context, and receipt references in one calm place.</p></div><Link className="button button-secondary" href="/donate">Give again</Link></div><div className="dashboard-notice"><div><strong>Payment safety by design.</strong><p>Pending gifts are intents only. A receipt is issued after a signed provider event marks a payment as successful.</p></div></div><div className="giving-history">{donations?.length ? donations.map((donation) => <article className="giving-history-row" key={donation.id}><div><p className="eyebrow">{campaignNames.get(donation.campaign_id) ?? "Foundation giving"}</p><h3>{formatMoney(Number(donation.amount), donation.currency)}{donation.recurring ? " · monthly" : ""}</h3><p className="form-note">{new Date(donation.created_at).toLocaleDateString()} · {donation.is_anonymous ? "Anonymous gift" : "Named gift"}</p></div><div className="giving-history-status"><span className={`status-badge status-${donation.status}`}>{donation.status}</span>{donation.receipt_number && <span className="form-note">Receipt {donation.receipt_number}</span>}</div></article>) : <div className="empty-state"><h3>Your giving history will appear here.</h3><p className="muted">Start with the foundation’s current campaign.</p><Link className="button" href="/donate">Explore giving</Link></div>}</div></section>;
}
