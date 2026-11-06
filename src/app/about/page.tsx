import { SectionHeading } from "@/components/section-heading";
import { focusGroups, foundation } from "@/lib/site";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">About the foundation</p><h1>We are building a more inclusive circle of care.</h1><p>{foundation.description}</p></div></section>
      <section className="section"><div className="container split"><div><SectionHeading eyebrow="Our purpose" title="Wellbeing is connected." /></div><div><p className="lead">We improve the wellbeing, capacity, and economic empowerment of women caregivers of children with disabilities through support services, training, and community inclusion.</p><p className="muted">Our wider work reaches caregivers of vulnerable groups, orphans and vulnerable children, people with disabilities, economically vulnerable women, and the society around them.</p></div></div></section>
      <section className="section soft-section"><div className="container"><SectionHeading eyebrow="Our circle" title="People first, always." description="These communities shape our priorities, partnerships, and the way this platform is designed." /><ul className="pill-list">{focusGroups.map((group) => <li key={group}>{group}</li>)}</ul></div></section>
      <section className="section" id="contact"><div className="container support-banner"><div><p className="eyebrow">Connect with us</p><h2>Public contact details will be confirmed with the foundation team.</h2><p>Until the official channels are approved, the site does not publish personal registration contacts from the source document.</p></div></div></section>
    </>
  );
}
