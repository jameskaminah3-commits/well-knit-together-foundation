import { SectionHeading } from "@/components/section-heading";
import { corePrograms, foundation } from "@/lib/site";

export const metadata = { title: "Programs" };

export default function ProgramsPage() {
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Our programs</p><h1>Support that meets people where they are.</h1><p>From caregiver support to livelihoods, learning, and advocacy, our programs are designed to be practical, respectful, and connected.</p></div></section>
      <section className="section"><div className="container"><div className="info-grid">{corePrograms.map((program) => <article className="info-card" id={program.href.split("#")[1]} key={program.title}><p className="eyebrow">{program.eyebrow}</p><h3>{program.title}</h3><p>{program.description}</p><p className="muted">This program area will support applications, referrals, participation records, outcome tracking, and public impact reporting.</p></article>)}</div></div></section>
      <section className="section soft-section"><div className="container split"><div><SectionHeading eyebrow="Where we work" title="Rooted in community." /></div><p className="lead muted">Our initial operating footprint includes {foundation.counties.join(", ")}. The administrative platform will keep county, program, partner, and reporting boundaries clear as the work grows.</p></div></section>
    </>
  );
}
