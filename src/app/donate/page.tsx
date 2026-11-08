import Link from "next/link";
import { DonationForm } from "@/components/donation-form";
import { campaignProgress, formatMoney, getActiveCampaigns } from "@/lib/fundraising";

export const metadata = { title: "Give support" };

export default async function DonatePage() {
  const campaigns = await getActiveCampaigns();
  const campaign = campaigns[0];
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Give support</p><h1>Help make care and opportunity possible.</h1><p>Your contribution supports caregiver-centred programs, training, inclusion, education, advocacy, and economic opportunity.</p></div></section>
      <section className="section"><div className="container giving-layout"><div><p className="eyebrow">Our active campaign</p><h2>{campaign?.title ?? "A wider circle of care."}</h2><p className="lead muted">{campaign?.summary ?? "Your gift will help build a safer, more inclusive future for caregivers and communities."}</p>{campaign && <div className="campaign-progress"><div className="campaign-progress-heading"><strong>{formatMoney(campaign.raised_amount, campaign.currency)} raised</strong><span>{formatMoney(campaign.goal_amount, campaign.currency)} goal</span></div><div className="progress-track" aria-label={`${campaignProgress(campaign)} percent of campaign goal`}><span style={{ width: `${campaignProgress(campaign)}%` }} /></div><p className="form-note">Every gift is recorded against a campaign, reconciled against a provider reference, and eligible for a receipt after successful payment.</p></div>}<div className="giving-trust-grid"><article className="info-card"><p className="eyebrow">Transparent</p><h3>Clear campaign purpose</h3><p>See where your contribution sits in the foundation’s approved funding story.</p></article><article className="info-card"><p className="eyebrow">Protected</p><h3>No raw card data</h3><p>Hosted checkout and signed payment events keep payment details outside this app.</p></article></div></div>{campaign ? <><DonationForm campaignId={campaign.id} currency={campaign.currency} />{campaign.source === "preview" && <p className="form-note">Local preview mode: connect the Supabase project to record this gift intent.</p>}</> : <div className="empty-state"><h3>Giving is opening soon.</h3><p className="muted">A campaign will appear here once it is approved.</p><Link className="button" href="/about">Learn about the foundation</Link></div>}</div></section>
    </>
  );
}
