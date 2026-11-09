import type { ReactNode } from "react";

export function LegalPage({ eyebrow, title, intro, updated, children }: { eyebrow: string; title: string; intro: string; updated: string; children: ReactNode }) {
  return <><section className="page-hero legal-hero"><div className="container narrow-page"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p><p className="legal-updated">Last reviewed {updated}</p></div></section><section className="section"><article className="container legal-body">{children}</article></section></>;
}
