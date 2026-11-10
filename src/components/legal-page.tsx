import Link from "next/link";
import type { ReactNode } from "react";
import { contactChannels, foundation, telHref } from "@/lib/site";

export function LegalPage({ eyebrow, title, intro, updated, children }: { eyebrow: string; title: string; intro: string; updated: string; children: ReactNode }) {
  return <><section className="page-hero legal-hero"><div className="container narrow-page"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p><p className="legal-updated">Last reviewed {updated}</p></div></section><section className="section"><article className="container legal-body">{children}<h2>How to reach us</h2><p>{foundation.legalName} · Reg. No. {foundation.registration.number}<br />{foundation.address.postal}{contactChannels.phone && <><br />Phone: <a href={telHref(contactChannels.phone)}>{contactChannels.phone}</a></>}{contactChannels.email && <><br />Email: <a href={`mailto:${contactChannels.email}`}>{contactChannels.email}</a></>}</p><p>You can also use the <Link href="/contact">contact page</Link> to choose the right route for your question.</p></article></section></>;
}
