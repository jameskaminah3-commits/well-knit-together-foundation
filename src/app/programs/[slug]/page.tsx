import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProgram } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = await getPublishedProgram(slug);
  return { title: program?.seo_title ?? program?.title ?? "Program", description: program?.seo_description ?? program?.summary };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await getPublishedProgram(slug);
  if (!program) notFound();

  return <><section className="page-hero"><div className="container"><p className="eyebrow">Program area</p><h1>{program.title}</h1><p>{program.summary}</p></div></section><section className="section"><div className="container split"><div><p className="eyebrow">What this holds</p><h2>Practical support, shaped with communities.</h2></div><div><p className="lead">{program.description}</p><p className="muted">This program is designed with dignity, accessibility, and clear referral pathways at its centre. Requests for support are handled privately by our trained team.</p><div className="button-row"><Link className="button" href="/support">Request support</Link><Link className="button button-secondary" href="/donate">Fund this program</Link></div></div></div></section><section className="section soft-section"><div className="container info-grid"><article className="info-card"><p className="eyebrow">Focus groups</p><ul className="pill-list">{program.focus_groups.map((group) => <li key={group}>{group.replaceAll("_", " ")}</li>)}</ul></article><article className="info-card"><p className="eyebrow">Counties</p><ul className="pill-list">{program.counties.map((county) => <li key={county}>{county}</li>)}</ul></article></div></section></>;
}
