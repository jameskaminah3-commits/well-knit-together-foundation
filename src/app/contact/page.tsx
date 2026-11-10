import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { SectionHeading } from "@/components/section-heading";
import { contactChannels, foundation, hasDirectContact, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Contact ${foundation.legalName} in ${foundation.address.locality}. Request support, partner with us, or ask about giving.`,
  alternates: { canonical: "/contact" },
};

const routes = [
  { icon: "heart", title: "I need support", description: "Caregivers and families can request help privately. You do not need an account.", href: "/support", cta: "Request support" },
  { icon: "shield", title: "A safeguarding concern", description: "Report a concern about a child or adult connected to our work. Emergency helplines are listed too.", href: "/safeguarding", cta: "Safeguarding & helplines" },
  { icon: "hands", title: "Partnerships & funding", description: "Organisations, donors, and government partners can start a conversation here.", href: "/engage/partner", cta: "Start a partnership" },
  { icon: "training", title: "Volunteering", description: "Tell us your skills and availability and we will contact you when a fitting role opens.", href: "/engage/volunteer", cta: "Offer your time" },
  { icon: "chat", title: "Feedback or a complaint", description: "Tell us what worked and what did not. You can stay anonymous.", href: "/feedback", cta: "Share feedback" },
  { icon: "basket", title: "Shop orders", description: "Questions about a marketplace order, delivery, or a return.", href: "/marketplace/terms", cta: "Marketplace terms" },
];

export default function ContactPage() {
  const direct = hasDirectContact();
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Contact us · Wasiliana nasi</p><h1>We would love to hear from you.</h1><p>Whether you are a caregiver looking for help, a partner, or a supporter, choose the route that fits and the right person on our team will reply.</p></div></section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Reach us directly" title="Talk to the team." />
          {direct ? (
            <div className="contact-grid">
              {contactChannels.phone && <article className="contact-card"><span className="way-icon"><Icon name="phone" /></span><h3>Call us</h3><a className="contact-value" href={telHref(contactChannels.phone)}>{contactChannels.phone}</a>{contactChannels.officeHours && <p>{contactChannels.officeHours}</p>}</article>}
              {contactChannels.whatsapp && <article className="contact-card"><span className="way-icon"><Icon name="chat" /></span><h3>WhatsApp</h3><a className="contact-value" href={`https://wa.me/${contactChannels.whatsapp}`} rel="noopener noreferrer" target="_blank">Message us on WhatsApp</a><p>Send a message any time and we will reply as soon as we can.</p></article>}
              {contactChannels.email && <article className="contact-card"><span className="way-icon"><Icon name="mail" /></span><h3>Email</h3><a className="contact-value" href={`mailto:${contactChannels.email}`}>{contactChannels.email}</a><p>For partnerships, media, and general enquiries.</p></article>}
              <article className="contact-card"><span className="way-icon"><Icon name="pin" /></span><h3>Write or visit</h3><p>{contactChannels.streetAddress ?? foundation.address.locality}<br />{foundation.address.postal}</p><p className="field-hint">Please call ahead before visiting so we can make sure the right person is available.</p></article>
            </div>
          ) : (
            <div className="contact-grid">
              <article className="contact-card"><span className="way-icon"><Icon name="pin" /></span><h3>Postal address</h3><p>{foundation.address.postal}</p></article>
              <article className="contact-card"><span className="way-icon"><Icon name="pin" /></span><h3>Our base</h3><p>{foundation.address.locality}, serving {foundation.counties.join(", ")}.</p></article>
              <article className="contact-card"><span className="way-icon"><Icon name="chat" /></span><h3>Send a message</h3><p>Use one of the routes below. Each one is reviewed by the part of our team responsible for it.</p></article>
            </div>
          )}
        </div>
      </section>

      <section className="section soft-section">
        <div className="container">
          <SectionHeading eyebrow="Choose a route" title="Get to the right person faster." />
          <div className="contact-grid">
            {routes.map((route) => <article className="contact-card" key={route.title}><span className="way-icon"><Icon name={route.icon} /></span><h3>{route.title}</h3><p>{route.description}</p><Link className="card-link" href={route.href}>{route.cta} <Icon name="arrow" size={16} /></Link></article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Registration" title="A registered Kenyan NGO." />
          <dl className="registration-card">
            <div><dt>Registered name</dt><dd>{foundation.legalName}</dd></div>
            <div><dt>Registration number</dt><dd>{foundation.registration.number}</dd></div>
            <div><dt>Registered with</dt><dd>{foundation.registration.authority}</dd></div>
            <div><dt>Counties of operation</dt><dd>{foundation.counties.join(", ")}</dd></div>
          </dl>
        </div>
      </section>
    </>
  );
}
