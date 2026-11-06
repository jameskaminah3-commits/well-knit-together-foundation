import Link from "next/link";

export const metadata = { title: "Give support" };

export default function DonatePage() {
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Give support</p><h1>Help make care and opportunity possible.</h1><p>Your contribution will support caregiver-centred programs, training, inclusion, education, advocacy, and economic opportunity.</p></div></section>
      <section className="section"><div className="container split"><div><h2>Giving will be simple, safe, and accountable.</h2><p className="lead muted">The donation experience will support campaign giving, recurring contributions, receipts, donor preferences, and approved impact updates.</p></div><div className="info-card"><p className="eyebrow">Donation module</p><h3>Secure giving is being connected next.</h3><p>Payment provider integration, M-Pesa workflows, card processing, webhook verification, reconciliation, and receipts are intentionally implemented in the funding phase.</p><Link className="button button-secondary" href="/login">Partner with us</Link></div></div></section>
    </>
  );
}
