import Link from "next/link";
import { getPublishedContentItems } from "@/lib/content";
import { formatEventDate, getUpcomingEvents } from "@/lib/engagement";

export const metadata = { title: "Events" };
export const dynamic = "force-dynamic";
export default async function EventsPage() {
  const [events, items] = await Promise.all([getUpcomingEvents(), getPublishedContentItems("event")]);
  const legacyEvents = items.filter((item) => !events.some((event) => event.slug === item.slug));
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Gatherings and learning</p><h1>Join the work in community.</h1><p>Thoughtful rooms for learning, making, and connecting with the foundation.</p></div></section><section className="section"><div className="container"><div className="event-grid">{events.map((event) => <article className="event-card" key={event.id}><div className="event-card-top"><p className="eyebrow">{event.source === "preview" ? "Sample event" : "Upcoming event"}</p><span className="status-badge status-published">Open</span></div><h3>{event.title}</h3><p>{event.summary}</p><div className="event-meta"><span>{formatEventDate(event.starts_at)}</span><span>{event.location}</span>{event.capacity && <span>{event.capacity} places</span>}</div><Link className="card-link" href={`/events/${event.slug}`}>View event and register →</Link></article>)}{legacyEvents.map((item) => <article className="event-card" key={item.id}><div className="event-card-top"><p className="eyebrow">Published event</p></div><h3>{item.title}</h3><p>{item.excerpt}</p>{item.location && <div className="event-meta"><span>{item.location}</span></div>}<Link className="card-link" href={`/events/${item.slug}`}>View event →</Link></article>)}</div>{!events.length && !legacyEvents.length && <div className="empty-state"><h3>Events will live here.</h3><p className="muted">No upcoming event has been published yet.</p></div>}</div></section></>;
}
