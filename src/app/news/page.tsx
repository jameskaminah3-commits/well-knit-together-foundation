import Link from "next/link";
import { getPublishedContentItems } from "@/lib/content";

export const metadata = { title: "News" };
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await getPublishedContentItems("news");
  return <><section className="page-hero"><div className="container"><p className="eyebrow">News</p><h1>Updates from the foundation.</h1><p>News, field notes, and announcements from our work with communities.</p></div></section><section className="section"><div className="container"><div className="info-grid">{items.length ? items.map((item) => <article className="info-card" key={item.id}><p className="eyebrow">News</p><h3>{item.title}</h3><p>{item.excerpt}</p><Link className="card-link" href={`/news/${item.slug}`}>Read update →</Link></article>) : <div className="empty-state"><h3>News will live here.</h3><p className="muted">The editorial team has not published an update yet.</p></div>}</div></div></section></>;
}
