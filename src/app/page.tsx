import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandArt } from "@/components/brand-art";
import { Icon } from "@/components/icon";
import { SectionHeading } from "@/components/section-heading";
import { getFoundationVisuals } from "@/lib/home-visuals";
import { corePrograms, focusGroups, foundation, impactPillars, waysWeWork, type FoundationVisual } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function Visual({ visual, variant, sizes, priority = false }: { visual: FoundationVisual; variant: "circle" | "weave" | "threads"; sizes: string; priority?: boolean }) {
  if (visual.src) return <Image src={visual.src} alt={visual.alt} fill priority={priority} sizes={sizes} />;
  return <BrandArt className="visual-art" variant={variant} label={`${visual.label}: illustration of a circle of people joined by woven threads`} />;
}

const waysToHelp = [
  { icon: "heart", title: "Give", description: "Fund training, equipment, and school fees for families who need them now.", href: "/donate", cta: "Donate" },
  { icon: "hands", title: "Partner", description: "Bring services, expertise, or funding to caregivers in the counties we serve.", href: "/engage/partner", cta: "Start a partnership" },
  { icon: "training", title: "Volunteer", description: "Share a skill, from therapy and teaching to accounting and design.", href: "/engage/volunteer", cta: "Offer your time" },
  { icon: "basket", title: "Shop", description: "Buy goods made by caregivers building an income around care.", href: "/marketplace", cta: "Visit the shop" },
];

export default async function HomePage() {
  const visuals = await getFoundationVisuals();
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy-column">
            <p className="eyebrow">Registered Kenyan NGO · Coastal Kenya &amp; Kajiado</p>
            <h1>No caregiver should carry it alone.</h1>
            <p className="hero-copy">We walk alongside women raising children with disabilities—with practical support, skills that earn an income, and communities where every child belongs.</p>
            <div className="button-row">
              <Link className="button" href="/support">Get support</Link>
              <Link className="button button-secondary" href="/donate">Support a caregiver</Link>
            </div>
            <p className="hero-swahili" lang="sw">Unahitaji msaada? <Link href="/support">Omba msaada hapa →</Link></p>
            <ul className="hero-proof" aria-label="About the foundation">
              <li><strong>{foundation.counties.length}</strong><span>counties served</span></li>
              <li><strong>{waysWeWork.length}</strong><span>ways we help families</span></li>
              <li><strong>Reg.</strong><span>{foundation.registration.number}</span></li>
            </ul>
          </div>
          <div className="hero-visual">
            <Visual visual={visuals[0]} variant="circle" sizes="(max-width: 900px) 100vw, 46vw" priority />
            <div className="hero-visual-overlay"><span className="eyebrow">Our promise</span><strong>Care is the thread. Community is the strength.</strong></div>
          </div>
        </div>
      </section>

      <section className="swahili-band" lang="sw" aria-label="Karibu">
        <div className="container swahili-band-inner">
          <p><strong>Karibu.</strong> Kama wewe ni mlezi wa mtoto mwenye ulemavu, hauko peke yako. Tuambie unahitaji msaada gani—ombi lako ni la siri.</p>
          <Link className="button button-small button-light" href="/support">Omba msaada</Link>
        </div>
      </section>

      <section className="section home-introduction">
        <div className="container split home-introduction-grid">
          <div className="home-photo-stack">
            <figure className="home-photo home-photo-main"><Visual visual={visuals[1]} variant="weave" sizes="(max-width: 560px) 90vw, 44vw" /></figure>
            <figure className="home-photo home-photo-small"><Visual visual={visuals[2]} variant="threads" sizes="(max-width: 560px) 52vw, 22vw" /></figure>
          </div>
          <div className="home-introduction-copy">
            <p className="eyebrow">Why we exist</p>
            <h2>Raising a child with a disability should not cost a mother everything else.</h2>
            <p className="lead muted">In many families the daily work of caring for a child with a disability falls on one woman. It can mean giving up paid work, facing stigma, and struggling to keep a child in school.</p>
            <p className="muted">Well Knit Together exists to change that—one caregiver, one support group, one community at a time. We listen first, build skills alongside caregivers, and connect care with opportunity.</p>
            <blockquote className="mission-quote"><span>Our registered objective</span>{foundation.mission}</blockquote>
            <Link className="card-link" href="/about">Read our story and governance <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container">
          <SectionHeading eyebrow="What we do" title="Five practical ways we help families." description="Support that caregivers can feel in their week—not just in a report." />
          <div className="ways-grid">
            {waysWeWork.map((way) => (
              <article className="way-card" key={way.title}>
                <span className="way-icon"><Icon name={way.icon} size={26} /></span>
                <h3>{way.title}</h3>
                <p>{way.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Our programs" title="Three program areas. One connected mission." description="Each program strengthens a different thread of a caregiver’s life: her wellbeing, her income, and her child’s place in school and community." />
          <div className="program-grid">
            {corePrograms.map((program, index) => (
              <article className="program-card" key={program.slug}>
                <p className="program-number">0{index + 1}</p>
                <p className="eyebrow">{program.eyebrow}</p>
                <h3>{program.title}</h3>
                <p>{program.description}</p>
                <Link className="card-link" href={`/programs#${program.slug}`}>Explore {program.title.toLowerCase()} <Icon name="arrow" size={16} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container split">
          <div className="quote-panel">
            <p>“We do not build around people. We build with people.”</p>
            <small>Caregivers shape our priorities, our programs, and how we measure success.</small>
          </div>
          <div>
            <SectionHeading eyebrow="Who we serve" title="Women caregivers first—and the circle around them." />
            <ul className="pill-list">
              {focusGroups.map((group) => <li key={group}>{group}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Where we work" title="Rooted on the coast. Reaching inland." description={`Our office is in ${foundation.address.locality}. We are registered to work across five counties.`} />
          <ul className="county-grid">
            {foundation.counties.map((county) => <li key={county}><Icon name="pin" size={18} /><span>{county}</span><small>County</small></li>)}
          </ul>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container">
          <SectionHeading eyebrow="How we measure change" title="Four outcomes we hold ourselves to." description="Every program is measured against the four outcomes in our registered objective. We publish approved figures and reports as each reporting cycle closes." />
          <div className="pillar-grid">
            {impactPillars.map((pillar, index) => (
              <article className="pillar-card" key={pillar.title}><span>0{index + 1}</span><h3>{pillar.title}</h3><p>{pillar.description}</p></article>
            ))}
          </div>
          <div className="section-actions"><Link className="button button-secondary" href="/impact">See our impact</Link><Link className="text-link" href="/reports">Read reports</Link></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Get involved" title="There is a place for you in the circle." />
          <div className="help-grid">
            {waysToHelp.map((way) => (
              <article className="help-card" key={way.title}>
                <span className="way-icon"><Icon name={way.icon} size={24} /></span>
                <h3>{way.title}</h3>
                <p>{way.description}</p>
                <Link className="card-link" href={way.href}>{way.cta} <Icon name="arrow" size={16} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section closing-section">
        <div className="container support-banner">
          <div>
            <p className="eyebrow">Every child belongs</p>
            <h2>Help a caregiver keep going.</h2>
            <p>Your gift pays for training, equipment, and school fees for families in Mombasa, Kilifi, Kwale, Tana River, and Kajiado.</p>
          </div>
          <div className="button-row"><Link className="button button-light" href="/donate">Donate</Link><Link className="button button-outline-light" href="/support">Get support</Link></div>
        </div>
      </section>
    </>
  );
}
