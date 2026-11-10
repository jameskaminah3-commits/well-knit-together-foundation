import type { Metadata } from "next";
import Link from "next/link";
import { DonationForm } from "@/components/donation-form";
import { Icon } from "@/components/icon";
import { campaignProgress, formatMoney, getActiveCampaigns } from "@/lib/fundraising";
import { getGivingSettings, hasDirectGivingDetails, onlineGivingAvailable, type GivingSettings } from "@/lib/payments/settings";
import { contactChannels, foundation, telHref, waysWeWork } from "@/lib/site";

export const metadata: Metadata = {
  title: "Donate",
  description: `Give to ${foundation.legalName} (Reg. ${foundation.registration.number}). Your gift funds training, equipment, school fees, and support for women caregivers of children with disabilities in Kenya.`,
  alternates: { canonical: "/donate" },
};
export const dynamic = "force-dynamic";

function DirectGiving({ settings: directGiving }: { settings: GivingSettings }) {
  const configured = hasDirectGivingDetails(directGiving);
  return (
    <div className="direct-giving">
      <div><p className="eyebrow">Give directly</p><h3>{configured ? "Give by M-Pesa or bank transfer." : "Talk to us about giving."}</h3></div>
      {(directGiving.mpesaPaybill || directGiving.mpesaTill) && (
        <div className="direct-giving-method">
          <h4>M-Pesa</h4>
          {directGiving.mpesaPaybill ? (
            <ol>
              <li>Open M-Pesa and choose <strong>Lipa na M-Pesa → Pay Bill</strong>.</li>
              <li>Business number: <strong>{directGiving.mpesaPaybill}</strong></li>
              <li>Account number: <strong>{directGiving.mpesaAccountReference ?? "DONATION"}</strong></li>
              <li>Enter the amount and your M-Pesa PIN.</li>
            </ol>
          ) : (
            <ol>
              <li>Open M-Pesa and choose <strong>Lipa na M-Pesa → Buy Goods</strong>.</li>
              <li>Till number: <strong>{directGiving.mpesaTill}</strong></li>
              <li>Enter the amount and your M-Pesa PIN.</li>
            </ol>
          )}
          <p className="form-note">Before you enter your PIN, check that M-Pesa shows the foundation’s name. Never send money to a personal number claiming to collect for us.</p>
        </div>
      )}
      {directGiving.bankName && directGiving.bankAccountNumber && (
        <div className="direct-giving-method">
          <h4>Bank transfer</h4>
          <dl>
            <dt>Bank</dt><dd>{directGiving.bankName}</dd>
            <dt>Account name</dt><dd>{directGiving.bankAccountName ?? foundation.legalName}</dd>
            <dt>Account number</dt><dd>{directGiving.bankAccountNumber}</dd>
            {directGiving.bankBranch && <><dt>Branch</dt><dd>{directGiving.bankBranch}</dd></>}
            {directGiving.bankSwift && <><dt>SWIFT</dt><dd>{directGiving.bankSwift}</dd></>}
          </dl>
        </div>
      )}
      {directGiving.givingNote && <p className="form-note">{directGiving.givingNote}</p>}
      <p className="muted">{configured ? "For a receipt, or to give in kind, as a business, or from outside Kenya, contact us and we will help." : "Secure online giving is being connected. To give now, pledge support, give in kind, or fund a specific program, contact our team and we will share verified payment details."}</p>
      <div className="button-row">
        {contactChannels.phone && <a className="button button-small" href={telHref(contactChannels.phone)}>Call {contactChannels.phone}</a>}
        {contactChannels.email && <a className="button button-small button-secondary" href={`mailto:${contactChannels.email}?subject=${encodeURIComponent("Giving to Well Knit Together")}`}>Email us</a>}
        <Link className="button button-small button-secondary" href="/engage/partner">Become a funding partner</Link>
      </div>
    </div>
  );
}

export default async function DonatePage() {
  const [campaigns, settings, onlineAvailable] = await Promise.all([getActiveCampaigns(), getGivingSettings(), onlineGivingAvailable()]);
  const campaign = campaigns[0];
  const showForm = Boolean(campaign) && (onlineAvailable || process.env.NODE_ENV !== "production");
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Donate</p><h1>Help a caregiver keep going.</h1><p>Your gift funds the practical things that change a family’s week: training, equipment, school fees, and a support group that shows up.</p></div></section>
      <section className="trust-strip"><div className="container trust-strip-inner"><span><strong>Registered Kenyan NGO</strong> · Reg. No. {foundation.registration.number}</span><span>Board-governed · Financial year {foundation.financialYear}</span><span><Link className="text-link" href="/reports">Annual reports published online →</Link></span></div></section>
      <section className="section">
        <div className="container giving-layout">
          <div>
            <p className="eyebrow">{campaign?.source === "database" ? "Our current appeal" : "Where your gift goes"}</p>
            <h2>{campaign?.source === "database" ? campaign.title : "Every gift goes to work for caregivers."}</h2>
            <p className="lead muted">{campaign?.source === "database" ? campaign.summary : "Gifts are used for our registered charitable purpose: improving the wellbeing, skills, and income of women caregivers of children with disabilities, and including their children in school and community life."}</p>
            {campaign?.source === "database" && campaign.raised_amount > 0 && <div className="campaign-progress"><div className="campaign-progress-heading"><strong>{formatMoney(campaign.raised_amount, campaign.currency)} raised</strong><span>{formatMoney(campaign.goal_amount, campaign.currency)} goal</span></div><div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={campaignProgress(campaign)} aria-label="Campaign progress"><span style={{ width: `${campaignProgress(campaign)}%` }} /></div></div>}
            <ul className="giving-uses">
              {waysWeWork.map((way) => <li key={way.title}><Icon name={way.icon} size={22} /><span><strong>{way.title}.</strong> {way.description}</span></li>)}
            </ul>
            <div className="giving-trust-grid" style={{ marginTop: 30 }}>
              <article className="info-card"><p className="eyebrow">Accountable</p><h3>Reported every year</h3><p>Approved annual and financial reports are published for supporters and partners.</p></article>
              <article className="info-card"><p className="eyebrow">Protected</p><h3>Safe payments</h3><p>We never see or store your card or M-Pesa PIN. Payments are handled by the provider.</p></article>
            </div>
          </div>
          <div>
            {showForm && campaign ? <><DonationForm campaignId={campaign.id} currency={campaign.currency} online={onlineAvailable} />{!onlineAvailable && <p className="form-note">Development mode: online giving is switched off, so gifts are recorded without charging anyone.</p>}{hasDirectGivingDetails(settings) && <div style={{ marginTop: 18 }}><DirectGiving settings={settings} /></div>}</> : <DirectGiving settings={settings} />}
          </div>
        </div>
      </section>
    </>
  );
}
