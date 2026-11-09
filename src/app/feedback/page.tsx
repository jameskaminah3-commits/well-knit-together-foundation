import { FeedbackForm } from "@/components/feedback-form";

export const metadata = { title: "Share feedback" };

export default function FeedbackPage() {
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Help shape the next release</p><h1>Tell us what made the path easier—or harder.</h1><p>We listen to caregivers, staff, makers, donors, partners, volunteers, and neighbours. Your feedback helps us make the experience clearer and more useful.</p></div></section><section className="section"><div className="container feedback-layout"><div><p className="eyebrow">A small, useful signal</p><h2>Good design leaves room for people.</h2><p className="lead muted">You do not need technical language. Tell us what you were trying to do, what helped, and where you had to stop and think.</p><div className="feedback-promise"><strong>What happens next</strong><span>We review feedback in themes, protect private details, and use it to guide improvements. We only contact you if you choose to share your email.</span></div></div><div className="feedback-card"><FeedbackForm /></div></div></section></>;
}
