import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { corePrograms, focusGroups, foundation } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Care. Capacity. Opportunity.</p>
            <h1>When caregivers are supported, whole communities grow stronger.</h1>
            <p className="hero-copy">{foundation.description}</p>
            <div className="button-row">
              <Link className="button" href="/programs">Explore our work</Link>
              <Link className="button button-secondary" href="/donate">Support a family</Link>
            </div>
          </div>
          <div className="hero-art" role="img" aria-label="Abstract illustration representing community and connection">
            <div className="art-card"><strong>5</strong><span>counties in our initial operating footprint</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Our focus"
            title="Practical support, built around real lives."
            description="Our work connects care, inclusion, education, advocacy, and economic empowerment so support can reach people in the ways they actually need it."
          />
          <div className="program-grid">
            {corePrograms.map((program) => (
              <article className="program-card" key={program.title}>
                <p className="eyebrow">{program.eyebrow}</p>
                <h3>{program.title}</h3>
                <p>{program.description}</p>
                <Link className="card-link" href={program.href}>Discover the work →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container split">
          <div className="quote-panel">
            <p>“Inclusion becomes real when care, dignity, and opportunity meet in the same place.”</p>
            <small>Our commitment to the people and communities we serve</small>
          </div>
          <div>
            <SectionHeading eyebrow="Who we serve" title="A wider circle of care." description="The platform and our programs are designed to keep the people most affected at the centre of every decision." />
            <ul className="pill-list">
              {focusGroups.map((group) => <li key={group}>{group}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stats">
            <div className="stat"><strong>01</strong><span>caregiver-centred foundation</span></div>
            <div className="stat"><strong>05</strong><span>counties in the initial footprint</span></div>
            <div className="stat"><strong>04</strong><span>impact pillars guiding our work</span></div>
            <div className="stat"><strong>∞</strong><span>possibilities created through inclusion</span></div>
          </div>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container support-banner">
          <div>
            <p className="eyebrow">Build with us</p>
            <h2>There is a place for your support.</h2>
            <p>Give, partner, volunteer, or help us bring a caregiver-led idea to life.</p>
          </div>
          <Link className="button" href="/donate">Get involved</Link>
        </div>
      </section>
    </>
  );
}
