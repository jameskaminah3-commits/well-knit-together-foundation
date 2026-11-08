import { PartnerApplicationForm } from "@/components/engagement-forms";

export const metadata = { title: "Partner with the foundation" };

export default function PartnerPage() {
  return <section className="section"><div className="container engagement-layout"><div className="story-body"><p className="eyebrow">Partnership</p><h1>Let’s make the connection useful.</h1><p className="lead muted">We welcome organisations that bring grounded expertise, trusted community relationships, or a clear way to strengthen care, inclusion, and economic opportunity.</p><div className="engagement-note"><strong>What happens next</strong><p>Our team reviews the fit, follows up with a human conversation, and records only what is needed to explore the idea.</p></div></div><PartnerApplicationForm /></div></section>;
}
