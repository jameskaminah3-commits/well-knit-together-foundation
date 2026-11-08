import { notFound } from "next/navigation";
import { getPublishedContentItem } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = await getPublishedContentItem(slug); if (!item || item.content_type !== "event") notFound(); return <article className="section"><div className="container story-body"><p className="eyebrow">Event{item.starts_at ? ` · ${new Date(item.starts_at).toLocaleString("en-KE")}` : ""}</p><h1>{item.title}</h1>{item.location && <p className="lead muted">{item.location}</p>}<p className="lead muted">{item.excerpt}</p><div className="story-body">{item.body.split("\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></article>; }
