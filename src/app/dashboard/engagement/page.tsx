import { redirect } from "next/navigation";
import { EngagementWorkflowPanel } from "@/components/engagement-workflows";
import { getAdminActor, hasEngagementAccess } from "@/lib/auth/admin-access";

export const metadata = { title: "Engagement workspace" };
export const dynamic = "force-dynamic";

export default async function EngagementDashboardPage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/engagement");
  if (!hasEngagementAccess(actor.roles, actor.assuranceLevel)) return <section className="dashboard-page narrow-page"><p className="eyebrow">Engagement workspace</p><h1>Verified engagement access required.</h1><p className="lead muted">Partner, volunteer, and event records are restricted to approved programme, marketplace, and administrator roles with an authenticator session.</p></section>;

  const [{ data: partners }, { data: volunteers }, { data: events }, { data: registrations }, { data: programs }, { data: diligence }, { data: partnerAssignments }, { data: volunteerAssignments }, { data: attendance }] = await Promise.all([
    actor.supabase.from("partner_applications").select("id, organization_name, contact_name, contact_email, focus_area, counties, status, created_at").order("created_at", { ascending: false }),
    actor.supabase.from("volunteer_applications").select("id, name, email, county, skills, availability, status, created_at").order("created_at", { ascending: false }),
    actor.supabase.from("engagement_events").select("id, title, starts_at, location, status").order("starts_at"),
    actor.supabase.from("event_registrations").select("id, event_id, name, email, status, created_at").order("created_at", { ascending: false }).limit(50),
    actor.supabase.from("programs").select("id, title").order("title"),
    actor.supabase.from("partner_due_diligence").select("partner_application_id, verification_status, notes"),
    actor.supabase.from("partner_program_assignments").select("partner_application_id, program_id, assignment_status"),
    actor.supabase.from("volunteer_assignments").select("volunteer_application_id, program_id, assignment_status"),
    actor.supabase.from("event_attendance").select("registration_id, attendance_status, notes"),
  ]);
  const partnerRows = partners ?? []; const volunteerRows = volunteers ?? []; const eventRows = events ?? []; const registrationRows = registrations ?? [];
  const eventNames = new Map(eventRows.map((event) => [event.id, event.title]));
  const workflowPartners = partnerRows.map((partner) => ({ ...partner, due_diligence: (diligence ?? []).find((row) => row.partner_application_id === partner.id) ?? null, assignments: (partnerAssignments ?? []).filter((row) => row.partner_application_id === partner.id) }));
  const workflowVolunteers = volunteerRows.map((volunteer) => ({ ...volunteer, assignments: (volunteerAssignments ?? []).filter((row) => row.volunteer_application_id === volunteer.id) }));
  const workflowRegistrations = registrationRows.map((registration) => ({ ...registration, event_title: eventNames.get(registration.event_id) ?? "Event", attendance: (attendance ?? []).find((row) => row.registration_id === registration.id) ?? null }));

  return <section className="dashboard-page"><div className="dashboard-heading"><div><p className="eyebrow">Phase 7 · engagement operations</p><h1>Keep the circle moving.</h1><p className="lead muted">Review applications, complete due diligence, assign people to programmes, mark attendance, and send appropriately segmented updates.</p></div></div><div className="engagement-dashboard-grid"><article className="dashboard-metric"><span>Partner interest</span><strong>{partnerRows.length}</strong><small>applications received</small></article><article className="dashboard-metric"><span>Volunteer interest</span><strong>{volunteerRows.length}</strong><small>people to follow up</small></article><article className="dashboard-metric"><span>Event registrations</span><strong>{registrationRows.length}</strong><small>latest 50 registrations</small></article></div><EngagementWorkflowPanel partners={workflowPartners} volunteers={workflowVolunteers} programs={programs ?? []} registrations={workflowRegistrations} /><div className="engagement-dashboard-columns engagement-overview"><div><div className="content-section-heading"><div><p className="eyebrow">Upcoming events</p><h3>{eventRows.length} event{eventRows.length === 1 ? "" : "s"}</h3></div></div><div className="application-list">{eventRows.length ? eventRows.map((event) => <article className="application-row" key={event.id}><div><strong>{event.title}</strong><span>{new Date(event.starts_at).toLocaleDateString("en-KE")} · {event.location}</span></div><span className={`status-badge status-${event.status}`}>{event.status}</span></article>) : <div className="empty-state"><p className="muted">No events seeded yet.</p></div>}</div></div><aside className="engagement-side-panel"><p className="eyebrow">Latest registrations</p>{workflowRegistrations.slice(0, 8).map((registration) => <div className="engagement-side-row" key={registration.id}><strong>{registration.name}</strong><span>{registration.event_title}</span><small>{registration.email} · {registration.status}</small></div>)}</aside></div></section>;
}
