"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="page-hero error-page"><div className="container narrow-page"><p className="eyebrow">A small pause</p><h1>Something needs a second look.</h1><p>We could not finish loading this page. Your information has not been submitted. Try again, or return to a calm starting point.</p><div className="button-row"><button className="button" type="button" onClick={() => reset()}>Try again</button><Link className="button button-secondary" href="/">Return home</Link></div></div></section>;
}
