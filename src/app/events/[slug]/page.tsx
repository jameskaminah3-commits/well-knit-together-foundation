import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedContentItem } from "@/lib/content";
import { EventRegistrationForm } from "@/components/engagement-forms";
import { eventHasEnded, formatEventDate, getEngagementEvent, registrationOpen } from "@/lib/engagement";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEngagementEvent(slug);
  if (event) return { title: event.title, description: event.summary };
  const item = await getPublishedContentItem(slug);
  return { title: item?.title ?? "Event", description: item?.excerpt };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEngagementEvent(slug);
  if (event) {
    const ended = eventHasEnded(event);
    const open = registrationOpen(event);
    const closedMessage = event.status === "cancelled" ? "This event has been cancelled. We are sorry for any inconvenience." : ended ? "This event has already taken place." : event.source === "preview" ? "This is a sample event shown only in local preview." : "Registration for this event has closed.";
    return <section className="section"><div className="container event-detail-layout"><div className="story-body"><Link className="text-link" href="/events">← All events</Link><p className="eyebrow" style={{ marginTop: 24 }}>{event.status === "cancelled" ? "Cancelled" : ended ? "Past event" : "Upcoming event"}</p><h1>{event.title}</h1><p className="lead muted">{event.summary}</p><div className="event-detail-meta"><span>{formatEventDate(event.starts_at)}</span><span>{event.location}</span>{event.capacity && <span>{event.capacity} places</span>}</div><div className="story-body">{event.description.split("\n").filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}{open && <p className="muted">Registration closes {event.registration_deadline ? formatEventDate(event.registration_deadline) : "when places fill"}.</p>}</div></div>{open ? <EventRegistrationForm event={event} /> : <div className="notice-card"><strong>Registration unavailable</strong><p>{closedMessage}</p><p><Link className="card-link" href="/events">See other events →</Link></p></div>}</div></section>;
  }
  const item = await getPublishedContentItem(slug);
  if (!item || item.content_type !== "event") notFound();
  return <article className="section"><div className="container story-body"><Link className="text-link" href="/events">← All events</Link><p className="eyebrow" style={{ marginTop: 24 }}>Event{item.starts_at ? ` · ${formatEventDate(item.starts_at)}` : ""}</p><h1>{item.title}</h1>{item.location && <p className="lead muted">{item.location}</p>}<p className="lead muted">{item.excerpt}</p><div className="story-body">{item.body.split("\n").filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div></article>;
}
