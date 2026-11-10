import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { SectionHeading } from "@/components/section-heading";
import { focusGroups, foundation, impactPillars, leadership, waysWeWork } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us and governance",
  description: `Who we are, why we exist, and how we are governed. ${foundation.legalName} is a registered Kenyan national NGO (${foundation.registration.number}) based in Nyali, Mombasa.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">About the foundation</p><h1>Women caregivers at the centre. A wider circle around them.</h1><p>{foundation.legalName} is a registered Kenyan national NGO based in {foundation.address.locality}. We work with women caring for children with disabilities—and the families, schools, and neighbours around them.</p></div></section>

      <section className="section">
        <div className="container split">
          <div><SectionHeading eyebrow="Our purpose" title="Wellbeing, capacity, income, and inclusion—together." /></div>
          <div>
            <blockquote className="mission-quote"><span>Our registered objective</span>{foundation.mission}</blockquote>
            <p className="lead muted">Caring for a child with a disability is skilled, round-the-clock work. When that work is unsupported, mothers lose income, children miss school, and families become isolated. We believe the answer is not a single service but a stronger web of people, skills, and choices.</p>
            <p className="muted">Our name says how we work: caregivers, communities, partners, and supporters, well knit together.</p>
          </div>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container">
          <SectionHeading eyebrow="How we work" title="What we do on the ground." description="These are the ways of working registered with the NGOs Co-ordination Board." />
          <div className="ways-grid">
            {waysWeWork.map((way) => <article className="way-card" key={way.title}><span className="way-icon"><Icon name={way.icon} size={26} /></span><h3>{way.title}</h3><p>{way.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div><SectionHeading eyebrow="Who we serve" title="People first, always." description="These groups shape our priorities, partnerships, and the way our services are designed." /></div>
          <ul className="pill-list">{focusGroups.map((group) => <li key={group}>{group}</li>)}</ul>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container">
          <SectionHeading eyebrow="Outcomes" title="Four outcomes guide every decision." />
          <div className="pillar-grid">{impactPillars.map((pillar, index) => <article className="pillar-card" key={pillar.title}><span>0{index + 1}</span><h3>{pillar.title}</h3><p>{pillar.description}</p></article>)}</div>
        </div>
      </section>

      <section className="section" id="governance">
        <div className="container">
          <SectionHeading eyebrow="Governance" title="Accountable to the people we serve." description={`The foundation is governed by a board of Kenyan citizens. Our financial year runs ${foundation.financialYear}, and approved reports are published on this site.`} />
          <ul className="leadership-grid">{leadership.map((person) => <li key={person.name}><strong>{person.name}</strong><span>{person.role}</span></li>)}</ul>
          <dl className="registration-card" style={{ marginTop: 28 }}>
            <div><dt>Registered name</dt><dd>{foundation.legalName}</dd></div>
            <div><dt>Registration number</dt><dd>{foundation.registration.number}</dd></div>
            <div><dt>Registered with</dt><dd>{foundation.registration.authority}</dd></div>
            <div><dt>Status</dt><dd>{foundation.registration.scope} · {foundation.registration.act}</dd></div>
            <div><dt>Counties of operation</dt><dd>{foundation.counties.join(", ")}</dd></div>
            <div><dt>Postal address</dt><dd>{foundation.address.postal}</dd></div>
          </dl>
          <div className="section-actions"><Link className="button" href="/reports">Read our reports</Link><Link className="button button-secondary" href="/contact">Contact the foundation</Link><Link className="text-link" href="/safeguarding">Our safeguarding commitments</Link></div>
        </div>
      </section>
    </>
  );
}
