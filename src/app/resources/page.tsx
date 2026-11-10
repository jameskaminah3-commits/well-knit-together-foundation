import Link from "next/link";
import { getPublishedContentItems } from "@/lib/content";

export const metadata = { title: "Resources" };
export const dynamic = "force-dynamic";
export default async function ResourcesPage() { const items = await getPublishedContentItems("resource"); return <><section className="page-hero"><div className="container"><p className="eyebrow">Resources</p><h1>Useful knowledge, made accessible.</h1><p>Guides, tools, and practical materials for caregivers, partners, and communities.</p></div></section><section className="section"><div className="container"><h2 className="sr-only">Latest</h2><div className="info-grid">{items.length ? items.map((item) => <article className="info-card" key={item.id}><p className="eyebrow">Resource</p><h3>{item.title}</h3><p>{item.excerpt}</p><Link className="card-link" href={`/resources/${item.slug}`}>Open resource →</Link></article>) : <div className="empty-state"><h3>Resources will live here.</h3><p className="muted">No public resource has been published yet.</p></div>}</div></div></section></>; }
