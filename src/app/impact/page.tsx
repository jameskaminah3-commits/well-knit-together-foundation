import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { impactPillars } from "@/lib/site";
import { getPublishedStories } from "@/lib/content";
import { getPublicImpactMetrics } from "@/lib/reporting";

export const metadata: Metadata = { title: "Impact", description: "How Well Knit Together measures change for caregivers and children with disabilities: approved figures, consented stories, and published reports.", alternates: { canonical: "/impact" } };
export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const [stories, metrics] = await Promise.all([getPublishedStories(), getPublicImpactMetrics()]);
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Impact & transparency</p><h1>Progress should be visible, honest, and useful.</h1><p>We publish figures only after they have been checked against programme records, and stories only with the consent of the people in them.</p></div></section>
      <section className="section"><div className="container"><SectionHeading eyebrow="Our outcomes" title="Four outcomes, one connected mission." description="Each outcome comes straight from our registered objective." /><div className="pillar-grid">{impactPillars.map((pillar, index) => <article className="pillar-card" key={pillar.title}><span>0{index + 1}</span><h3>{pillar.title}</h3><p>{pillar.description}</p></article>)}</div></div></section>
      <section className="section soft-section"><div className="container"><SectionHeading eyebrow="Approved figures" title="A clear view of progress." description="These figures are aggregated, reviewed, and approved for public sharing. They never expose an individual’s record." />{metrics.length ? <div className="impact-metric-grid">{metrics.map((metric) => <article className="impact-metric-card" key={metric.id}><p className="eyebrow">{metric.period_label}</p><strong>{new Intl.NumberFormat("en-KE").format(metric.value)} <small>{metric.unit}</small></strong><h3>{metric.label}</h3>{(metric.county || metric.beneficiary_group) && <p className="muted">{[metric.county, metric.beneficiary_group?.replaceAll("_", " ")].filter(Boolean).join(" · ")}</p>}{metric.public_note && <p className="muted">{metric.public_note}</p>}</article>)}</div> : <div className="empty-state"><h3>Our first verified figures are on the way.</h3><p className="muted">We publish numbers only after each reporting period has been checked. Until then, you can read about how we work on our <Link className="text-link" href="/programs">programs page</Link>.</p></div>}</div></section>
      <section className="section"><div className="container"><SectionHeading eyebrow="Stories from the circle" title="Evidence with dignity." description="Every story is shared with the consent of the people in it and reviewed before publication." />{stories.length ? <div className="info-grid">{stories.map((story) => <article className="info-card" key={story.id}><p className="eyebrow">Story</p><h3>{story.title}</h3><p>{story.excerpt}</p><Link className="card-link" href={`/impact/${story.slug}`}>Read story →</Link></article>)}</div> : <div className="empty-state"><h3>Stories will be shared here.</h3><p className="muted">We are gathering stories with caregivers who have chosen to share them.</p></div>}<div className="section-actions"><Link className="button button-secondary" href="/reports">Read our reports</Link></div></div></section>
    </>
  );
}
