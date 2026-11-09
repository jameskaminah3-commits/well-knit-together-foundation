import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { impactPillars } from "@/lib/site";
import { getPublishedStories } from "@/lib/content";
import { getPublicImpactMetrics } from "@/lib/reporting";

export const metadata = { title: "Impact" };
export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const [stories, metrics] = await Promise.all([getPublishedStories(), getPublicImpactMetrics()]);
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Impact & transparency</p><h1>Progress should be visible, honest, and useful.</h1><p>Stories and measurable outcomes will help supporters and communities understand what is changing, while private records remain protected.</p></div></section>
      <section className="section"><div className="container"><SectionHeading align="center" eyebrow="Our impact framework" title="Four pillars, one connected mission." /><div className="program-grid">{impactPillars.map((pillar, index) => <article className="program-card" key={pillar}><p className="eyebrow">0{index + 1}</p><h3>{pillar}</h3><p>Outcome indicators, stories, and supporting evidence will be managed through the internal reporting system and published with appropriate privacy controls.</p></article>)}</div></div></section>
      <section className="section"><div className="container"><SectionHeading eyebrow="Approved measures" title="A clear view of progress." description="These figures are aggregated, reviewed, and approved for public sharing. They do not expose individual or case-level records." />{metrics.length ? <div className="impact-metric-grid">{metrics.map((metric) => <article className="impact-metric-card" key={metric.id}><p className="eyebrow">{metric.period_label}</p><strong>{new Intl.NumberFormat("en-KE").format(metric.value)} <small>{metric.unit}</small></strong><h3>{metric.label}</h3>{(metric.county || metric.beneficiary_group) && <p className="muted">{[metric.county, metric.beneficiary_group?.replaceAll("_", " ")].filter(Boolean).join(" · ")}</p>}{metric.public_note && <p className="muted">{metric.public_note}</p>}</article>)}</div> : <div className="empty-state"><h3>Measurement is being prepared.</h3><p className="muted">Approved public metrics will appear here as the reporting cycle matures.</p></div>}</div></section>
      <section className="section soft-section"><div className="container"><SectionHeading eyebrow="Stories from the circle" title="Evidence with dignity." description="Published stories require recorded consent and editorial review. No private beneficiary record is exposed on this page." />{stories.length ? <div className="info-grid">{stories.map((story) => <article className="info-card" key={story.id}><p className="eyebrow">Story</p><h3>{story.title}</h3><p>{story.excerpt}</p><Link className="card-link" href={`/impact/${story.slug}`}>Read story →</Link></article>)}</div> : <div className="empty-state"><h3>Impact stories will live here.</h3><p className="muted">The editorial team has not published a consented story yet.</p></div>}</div></section>
    </>
  );
}
