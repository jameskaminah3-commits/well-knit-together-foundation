import Link from "next/link";
import { BrandMark } from "@/components/brand-art";
import { MobileNav } from "@/components/mobile-nav";
import { foundation } from "@/lib/site";

const primaryLinks = [
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/impact", label: "Impact" },
  { href: "/engage", label: "Get involved" },
  { href: "/marketplace", label: "Shop" },
  { href: "/contact", label: "Contact" },
];

const secondaryLinks = [
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/resources", label: "Resources" },
  { href: "/reports", label: "Reports" },
  { href: "/login", label: "Sign in" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label={`${foundation.legalName} — home`}>
          <BrandMark size={42} />
          <span>
            <strong>Well Knit Together</strong>
            <small>Global Foundation</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {primaryLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="header-help" href="/support">Get support</Link>
          <Link className="button button-small button-accent" href="/donate">Donate</Link>
          <MobileNav links={primaryLinks} secondary={secondaryLinks} />
        </div>
      </div>
    </header>
  );
}
