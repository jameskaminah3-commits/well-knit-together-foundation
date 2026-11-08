import { notFound } from "next/navigation";
import { getPublishedContentItem } from "@/lib/content";
import { EventRegistrationForm } from "@/components/engagement-forms";
import { formatEventDate, getEngagementEvent } from "@/lib/engagement";

export const dynamic = "force-dynamic";
export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEngagementEvent(slug);
  if (event) return <section className="section"><div className="container event-detail-layout"><div className="story-body"><p className="eyebrow">{event.source === "preview" ? "Sample event" : "Upcoming event"}</p><h1>{event.title}</h1><p className="lead muted">{event.summary}</p><div className="event-detail-meta"><span>{formatEventDate(event.starts_at)}</span><span>{event.location}</span>{event.capacity && <span>{event.capacity} places</span>}</div><div className="story-body"><p>{event.description}</p><p className="muted">Registration closes {event.registration_deadline ? formatEventDate(event.registration_deadline) : "when places fill"}.</p></div></div><EventRegistrationForm event={event} /></div></section>;
  const item = await getPublishedContentItem(slug);
  if (!item || item.content_type !== "event") notFound();
  return <article className="section"><div className="container story-body"><p className="eyebrow">Published event{item.starts_at ? ` · ${new Date(item.starts_at).toLocaleString("en-KE")}` : ""}</p><h1>{item.title}</h1>{item.location && <p className="lead muted">{item.location}</p>}<p className="lead muted">{item.excerpt}</p><div className="story-body">{item.body.split("\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></article>;
}
