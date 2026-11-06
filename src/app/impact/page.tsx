import { SectionHeading } from "@/components/section-heading";
import { impactPillars } from "@/lib/site";

export const metadata = { title: "Impact" };

export default function ImpactPage() {
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Impact & transparency</p><h1>Progress should be visible, honest, and useful.</h1><p>As programs launch, this space will connect stories and measurable outcomes so supporters and communities can understand what is changing.</p></div></section>
      <section className="section"><div className="container"><SectionHeading align="center" eyebrow="Our impact framework" title="Four pillars, one connected mission." /><div className="program-grid">{impactPillars.map((pillar, index) => <article className="program-card" key={pillar}><p className="eyebrow">0{index + 1}</p><h3>{pillar}</h3><p>Outcome indicators, stories, and supporting evidence will be managed through the internal reporting system and published with appropriate privacy controls.</p></article>)}</div></div></section>
      <section className="section soft-section"><div className="container empty-state"><h3>Impact reports will live here.</h3><p className="muted">The reporting module is scheduled for a later implementation phase, with approved public metrics separated from confidential beneficiary records.</p></div></section>
    </>
  );
}
