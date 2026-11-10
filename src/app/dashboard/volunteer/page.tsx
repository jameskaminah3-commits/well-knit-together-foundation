import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminActor } from "@/lib/auth/admin-access";
import { formatEventDate } from "@/lib/engagement";

export const metadata = { title: "My volunteering" };
export const dynamic = "force-dynamic";

export default async function VolunteerWorkspacePage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/volunteer");
  const [{ data: applications }, { data: assignments }, { data: registrations }, { data: notifications }] = await Promise.all([
    actor.supabase.from("volunteer_applications").select("id, skills, availability, county, status, created_at").order("created_at", { ascending: false }),
    actor.supabase.from("volunteer_assignments").select("id, assignment_status, notes, assigned_at, programs(title)").order("assigned_at", { ascending: false }),
    actor.supabase.from("event_registrations").select("id, status, event_id, engagement_events(title, starts_at, location)").order("created_at", { ascending: false }),
    actor.supabase.from("engagement_notifications").select("id, title, body, created_at").eq("status", "sent").order("created_at", { ascending: false }).limit(5),
  ]);
  const statusText: Record<string, string> = { pending: "Received", in_review: "Being reviewed", approved: "Approved", declined: "Not taken forward", archived: "Closed" };

  return <section className="dashboard-page narrow-page">
    <div className="dashboard-heading"><div><p className="eyebrow">My volunteering</p><h1>Asante for your time.</h1><p className="lead muted">Your applications, where you are helping, and the gatherings you have joined.</p></div><Link className="button button-secondary" href="/events">Find events</Link></div>
    <div className="content-section-heading"><div><p className="eyebrow">Assignments</p><h3>Where you are helping</h3></div></div>
    <div className="application-list">{(assignments ?? []).map((assignment) => { const program = Array.isArray(assignment.programs) ? assignment.programs[0] : assignment.programs; return <article className="application-row" key={assignment.id}><div><strong>{(program as { title?: string } | null)?.title ?? "Programme"}</strong><span>{assignment.notes || "Your programme lead will be in touch with details."}</span></div><span className={`status-badge status-${assignment.assignment_status}`}>{assignment.assignment_status}</span></article>; })}{!assignments?.length && <div className="empty-state"><p className="muted">No assignments yet. Once your application is approved, a programme lead will match you with a role.</p></div>}</div>
    <div className="content-section-heading engagement-list-heading"><div><p className="eyebrow">Applications</p><h3>What you offered</h3></div><Link className="text-link" href="/engage/volunteer">Offer something new</Link></div>
    <div className="application-list">{(applications ?? []).map((application) => <article className="application-row" key={application.id}><div><strong>{application.skills.slice(0, 90)}{application.skills.length > 90 ? "…" : ""}</strong><span>{application.availability}{application.county ? ` · ${application.county}` : ""}</span></div><span className={`status-badge status-${application.status}`}>{statusText[application.status] ?? application.status}</span></article>)}{!applications?.length && <div className="empty-state"><p className="muted">Applications you send while signed in appear here. If you applied before creating an account, an administrator can link it for you.</p></div>}</div>
    <div className="content-section-heading engagement-list-heading"><div><p className="eyebrow">Events</p><h3>Gatherings you joined</h3></div></div>
    <div className="application-list">{(registrations ?? []).map((registration) => { const event = (Array.isArray(registration.engagement_events) ? registration.engagement_events[0] : registration.engagement_events) as { title?: string; starts_at?: string; location?: string } | null; return <article className="application-row" key={registration.id}><div><strong>{event?.title ?? "Event"}</strong><span>{event?.starts_at ? formatEventDate(event.starts_at) : ""}{event?.location ? ` · ${event.location}` : ""}</span></div><span className={`status-badge status-${registration.status}`}>{registration.status}</span></article>; })}{!registrations?.length && <div className="empty-state"><p className="muted">No event registrations yet.</p></div>}</div>
    {notifications?.length ? <><div className="content-section-heading engagement-list-heading"><div><p className="eyebrow">Updates</p><h3>For volunteers</h3></div></div><div className="notification-inbox">{notifications.map((item) => <article key={item.id}><strong>{item.title}</strong><p className="muted">{item.body}</p></article>)}</div></> : null}
  </section>;
}
