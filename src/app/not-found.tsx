import Link from "next/link";

export default function NotFound() {
  return <section className="page-hero error-page"><div className="container narrow-page"><p className="eyebrow">404 · Not found</p><h1>That page is not in the circle.</h1><p>It may have moved, or the link may be out of date. The main paths are still close by.</p><div className="button-row"><Link className="button" href="/">Return home</Link><Link className="button button-secondary" href="/support">Request support</Link></div></div></section>;
}
