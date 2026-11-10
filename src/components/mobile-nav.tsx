"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type NavLink = { href: string; label: string };

export function MobileNav({ links, secondary }: { links: NavLink[]; secondary: NavLink[] }) {
  const pathname = usePathname();
  const details = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (details.current) details.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && details.current?.open) {
        details.current.open = false;
        details.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <details className="mobile-nav" ref={details}>
      <summary aria-label="Open menu">Menu</summary>
      <nav className="mobile-nav-panel" aria-label="Mobile navigation">
        <Link className="mobile-nav-primary" href="/support">Get support · Pata msaada</Link>
        {links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
        <span className="mobile-nav-divider" aria-hidden="true" />
        {secondary.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
      </nav>
    </details>
  );
}
