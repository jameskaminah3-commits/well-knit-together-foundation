import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { SectionHeading } from "@/components/section-heading";
import { corePrograms, foundation, waysWeWork } from "@/lib/site";
import { CoverImage } from "@/components/cover-image";
import { getPublishedPrograms, mediaSrc } from "@/lib/content";

export const metadata: Metadata = { title: "Programs", description: "Caregiver support, skills and livelihoods, and education and advocacy programs for women caregivers of children with disabilities in coastal Kenya and Kajiado.", alternates: { canonical: "/programs" } };
export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const programs = await getPublishedPrograms();
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Our programs</p><h1>Support that meets families where they are.</h1><p>Three connected program areas strengthen a caregiver’s wellbeing, her income, and her child’s place in school and community.</p></div></section>
      <section className="section"><div className="container"><h2 className="sr-only">Program areas</h2><div className="info-grid">{programs.length ? programs.map((program) => <article className="info-card has-cover" id={program.slug} key={program.id}><CoverImage src={mediaSrc(program.image_path)} /><p className="eyebrow">Program area</p><h3>{program.title}</h3><p>{program.summary}</p>{program.description && <p className="muted">{program.description}</p>}<Link className="card-link" href={`/programs/${program.slug}`}>Explore this program <Icon name="arrow" size={16} /></Link></article>) : corePrograms.map((program) => <article className="info-card" id={program.slug} key={program.slug}><p className="eyebrow">{program.eyebrow}</p><h3>{program.title}</h3><p>{program.description}</p><Link className="card-link" href="/support">Ask about this program <Icon name="arrow" size={16} /></Link></article>)}</div></div></section>
      <section className="section soft-section"><div className="container"><SectionHeading eyebrow="How we deliver" title="What families can expect from us." /><div className="ways-grid">{waysWeWork.map((way) => <article className="way-card" key={way.title}><span className="way-icon"><Icon name={way.icon} size={26} /></span><h3>{way.title}</h3><p>{way.description}</p></article>)}</div></div></section>
      <section className="section"><div className="container split"><div><SectionHeading eyebrow="Where we work" title="Rooted in community." /></div><div><p className="lead muted">We are registered to work in {foundation.counties.join(", ")}. If you live elsewhere you can still contact us—we will try to refer you to a trusted service near you.</p><div className="button-row"><Link className="button" href="/support">Request support</Link><Link className="button button-secondary" href="/engage/partner">Partner on a program</Link></div></div></div></section>
    </>
  );
}
