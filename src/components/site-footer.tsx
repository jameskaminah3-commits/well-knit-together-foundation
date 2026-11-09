import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-kicker">Well Knit Together</p>
          <p className="footer-copy">
            Building stronger caregivers, more resilient livelihoods, and communities where everyone belongs.
          </p>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <Link href="/programs">Our programs</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/impact">Impact and reports</Link>
          <Link href="/reports">Annual reports</Link>
          <Link href="/resources">Guides and resources</Link>
          <Link href="/support">Request support</Link>
        </div>
        <div>
          <p className="footer-label">Get involved</p>
          <Link href="/donate">Donate</Link>
          <Link href="/login">Partner portal</Link>
          <Link href="/feedback">Share feedback</Link>
          <Link href="/about#contact">Contact the foundation</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Well Knit Together Global Foundation</span>
        <span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/safeguarding">Safeguarding</Link> · <Link href="/refunds">Giving & refunds</Link></span>
      </div>
    </footer>
  );
}
