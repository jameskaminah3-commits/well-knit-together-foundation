import { VolunteerApplicationForm } from "@/components/engagement-forms";

export const metadata = { title: "Volunteer with the foundation" };

export default function VolunteerPage() {
  return <section className="section"><div className="container engagement-layout"><div className="story-body"><p className="eyebrow">Volunteering</p><h1>Bring what you know. Make space for others.</h1><p className="lead muted">We are building a thoughtful volunteer circle for people who value dignity, reliability, and learning alongside community.</p><div className="engagement-note"><strong>Good to know</strong><p>You do not need a perfect CV. Tell us what you enjoy, when you are available, and where your contribution could be useful.</p></div></div><VolunteerApplicationForm /></div></section>;
}
