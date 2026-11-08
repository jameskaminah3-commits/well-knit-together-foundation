import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { getFoundationVisuals } from "@/lib/home-visuals";
import { corePrograms, focusGroups, foundation } from "@/lib/site";

export default async function HomePage() {
  const foundationVisuals = await getFoundationVisuals();
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Well Knit Together Global Foundation</p>
            <h1>Care is the thread. Community is the strength.</h1>
            <p className="hero-copy">{foundation.description}</p>
            <div className="button-row">
              <Link className="button" href="/programs">Explore our work</Link>
              <Link className="button button-secondary" href="/engage">Join the circle</Link>
            </div>
            <div className="hero-proof"><span><strong>5</strong> counties in our initial footprint</span><span><strong>4</strong> connected impact pillars</span></div>
          </div>
          <div className="hero-visual">
            <img src={foundationVisuals[0].src} alt={foundationVisuals[0].alt} />
            <div className="hero-visual-overlay"><span className="eyebrow">{foundationVisuals[0].label}</span><strong>When people have room to make, care, and lead.</strong><small>{foundationVisuals[0].credit}</small></div>
          </div>
        </div>
      </section>

      <section className="section home-introduction">
        <div className="container split home-introduction-grid">
          <div className="home-photo-stack">
            <figure className="home-photo home-photo-main"><img src={foundationVisuals[1].src} alt={foundationVisuals[1].alt} /><figcaption>{foundationVisuals[1].credit}</figcaption></figure>
            <figure className="home-photo home-photo-small"><img src={foundationVisuals[2].src} alt={foundationVisuals[2].alt} /><figcaption>{foundationVisuals[2].credit}</figcaption></figure>
          </div>
          <div className="home-introduction-copy"><p className="eyebrow">Our reason for being</p><h2>Every person has a place in the circle.</h2><p className="lead muted">Well Knit Together exists to make support feel practical, dignified, and connected—especially for caregivers, children, women, and people with disabilities.</p><p className="muted">We listen first, build capacity alongside communities, and connect care with opportunity. The result is not a single service. It is a stronger local web of people, skills, and choices.</p><Link className="card-link" href="/about">Learn what guides us →</Link></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Our focus"
            title="One foundation. Four ways to strengthen the circle."
            description="Our work connects care, inclusion, education, advocacy, and economic empowerment so support can reach people in the ways they actually need it."
          />
          <div className="program-grid">
            {corePrograms.map((program) => (
              <article className="program-card" key={program.title}>
                <p className="program-number">0{corePrograms.indexOf(program) + 1}</p><p className="eyebrow">{program.eyebrow}</p>
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
            <p>“We do not build around people. We build with people.”</p>
            <small>A caregiver-led, dignity-centred approach to change</small>
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
          <Link className="button" href="/engage">Join the circle</Link>
        </div>
      </section>
    </>
  );
}
