import Link from "next/link";
import { BrandMark } from "@/components/brand-art";
import { contactChannels, foundation, telHref } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-identity">
          <div className="footer-brand"><BrandMark size={44} /><p className="footer-kicker">Well Knit Together<small>Global Foundation</small></p></div>
          <p className="footer-copy">{foundation.tagline} We walk alongside women caregivers of children with disabilities in {foundation.counties.slice(0, -1).join(", ")} and {foundation.counties.at(-1)}.</p>
          <p className="footer-registration">Registered {foundation.registration.scope} · Reg. No. {foundation.registration.number}<br />{foundation.registration.authority}</p>
          <address className="footer-address">
            {foundation.address.postal}
            {contactChannels.phone && <><br /><a href={telHref(contactChannels.phone)}>{contactChannels.phone}</a></>}
            {contactChannels.email && <><br /><a href={`mailto:${contactChannels.email}`}>{contactChannels.email}</a></>}
          </address>
        </div>
        <div>
          <p className="footer-label">Get help</p>
          <Link href="/support">Request support</Link>
          <Link href="/safeguarding">Safeguarding & helplines</Link>
          <Link href="/resources">Guides & resources</Link>
          <Link href="/contact">Contact us</Link>
        </div>
        <div>
          <p className="footer-label">Get involved</p>
          <Link href="/donate">Donate</Link>
          <Link href="/engage/partner">Partner with us</Link>
          <Link href="/engage/volunteer">Volunteer</Link>
          <Link href="/events">Events</Link>
          <Link href="/marketplace">Shop maker goods</Link>
        </div>
        <div>
          <p className="footer-label">Accountability</p>
          <Link href="/about">About & governance</Link>
          <Link href="/impact">Impact</Link>
          <Link href="/reports">Reports</Link>
          <Link href="/news">News</Link>
          <Link href="/feedback">Share feedback</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {foundation.legalName}</span>
        <span className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/safeguarding">Safeguarding</Link><Link href="/refunds">Giving & refunds</Link><Link href="/login">Staff & partner sign in</Link></span>
      </div>
    </footer>
  );
}
