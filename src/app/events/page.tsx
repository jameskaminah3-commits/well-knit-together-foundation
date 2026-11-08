import Link from "next/link";
import { getPublishedContentItems } from "@/lib/content";

export const metadata = { title: "Events" };
export const dynamic = "force-dynamic";
export default async function EventsPage() { const items = await getPublishedContentItems("event"); return <><section className="page-hero"><div className="container"><p className="eyebrow">Events</p><h1>Join the work in community.</h1><p>Gatherings, learning sessions, and opportunities to connect with the foundation.</p></div></section><section className="section"><div className="container"><div className="info-grid">{items.length ? items.map((item) => <article className="info-card" key={item.id}><p className="eyebrow">Event{item.starts_at ? ` · ${new Date(item.starts_at).toLocaleDateString("en-KE")}` : ""}</p><h3>{item.title}</h3><p>{item.excerpt}</p>{item.location && <p className="muted">{item.location}</p>}<Link className="card-link" href={`/events/${item.slug}`}>View event →</Link></article>) : <div className="empty-state"><h3>Events will live here.</h3><p className="muted">No upcoming event has been published yet.</p></div>}</div></div></section></>; }
