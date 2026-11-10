import Link from "next/link";
import { Helplines } from "@/components/helplines";
import { LegalPage } from "@/components/legal-page";
import { contactChannels } from "@/lib/site";

export const metadata = { title: "Safeguarding and helplines", description: "Our commitments to keeping children and adults safe, how to raise a concern, and Kenyan emergency helplines.", alternates: { canonical: "/safeguarding" } };

export default function SafeguardingPage() {
  return <LegalPage eyebrow="Safeguarding" title="Safety is part of every doorway." intro="We put dignity, consent, and the best interests of children and adults at risk at the centre of everything we do." updated="10 November 2026">
    <Helplines />
    <p>Calls to 116 and 1195 are free and answered 24 hours a day.</p>
    <h2>What we expect of everyone who works with us</h2><p>Staff, board members, volunteers, and partners should listen, respect boundaries, avoid unsupervised one-to-one contact with children where a safer arrangement is possible, and never trade help for money, favours, images, or personal attention. Children with disabilities can be at greater risk of harm and may find it harder to tell someone. We take extra care to notice and to ask.</p>
    <h2>How to raise a concern</h2><p>If you are worried about a child or adult connected to our work—including about the behaviour of anyone from the foundation—tell us. {contactChannels.safeguardingEmail ? <>Email our safeguarding lead at <a href={`mailto:${contactChannels.safeguardingEmail}`}>{contactChannels.safeguardingEmail}</a>, or </> : null}use the <Link href="/support">support request form</Link> and tick “There is an immediate safety or protection concern”, or contact us and say the word “safeguarding” so the message is routed to the designated lead.</p>
    <h2>What happens next</h2><p>We record only the information that is needed, limit who can see it, and route it to a designated safeguarding lead for review. Where a child or adult is at risk, we will involve the relevant authorities, such as the police or the Department of Children’s Services. We will not publish incident details, and we will not punish anyone for raising a concern in good faith.</p>
    <h2>Consent, stories, and photographs</h2><p>Support, stories, photographs, and communications are separate consents. We do not photograph children without a parent or guardian’s consent, we never publish a child’s full name with their location, and anyone can withdraw a story or image without losing access to support.</p>
  </LegalPage>;
}
