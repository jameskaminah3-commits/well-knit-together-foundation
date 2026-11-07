import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { impactPillars } from "@/lib/site";
import { getPublishedStories } from "@/lib/content";

export const metadata = { title: "Impact" };
export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const stories = await getPublishedStories();
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Impact & transparency</p><h1>Progress should be visible, honest, and useful.</h1><p>Stories and measurable outcomes will help supporters and communities understand what is changing, while private records remain protected.</p></div></section>
      <section className="section"><div className="container"><SectionHeading align="center" eyebrow="Our impact framework" title="Four pillars, one connected mission." /><div className="program-grid">{impactPillars.map((pillar, index) => <article className="program-card" key={pillar}><p className="eyebrow">0{index + 1}</p><h3>{pillar}</h3><p>Outcome indicators, stories, and supporting evidence will be managed through the internal reporting system and published with appropriate privacy controls.</p></article>)}</div></div></section>
      <section className="section soft-section"><div className="container"><SectionHeading eyebrow="Stories from the circle" title="Evidence with dignity." description="Published stories require recorded consent and editorial review. No private beneficiary record is exposed on this page." />{stories.length ? <div className="info-grid">{stories.map((story) => <article className="info-card" key={story.id}><p className="eyebrow">Story</p><h3>{story.title}</h3><p>{story.excerpt}</p><Link className="card-link" href={`/impact/${story.slug}`}>Read story →</Link></article>)}</div> : <div className="empty-state"><h3>Impact stories will live here.</h3><p className="muted">The editorial team has not published a consented story yet.</p></div>}</div></section>
    </>
  );
}
