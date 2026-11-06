import Link from "next/link";
import { foundation } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label={`${foundation.legalName} home`}>
          <span className="brand-mark" aria-hidden="true">WK</span>
          <span>
            <strong>Well Knit Together</strong>
            <small>Global Foundation</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/about">About</Link>
          <Link href="/programs">Programs</Link>
          <Link href="/impact">Impact</Link>
          <Link href="/marketplace">Marketplace</Link>
        </nav>
        <div className="header-actions">
          <Link className="text-link hide-mobile" href="/login">Sign in</Link>
          <Link className="button button-small" href="/donate">Give support</Link>
        </div>
      </div>
    </header>
  );
}
