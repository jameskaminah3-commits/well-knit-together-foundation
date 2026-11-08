import { createClient } from "@/lib/supabase/server";

export interface EngagementEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  location: string;
  capacity: number | null;
  status: "draft" | "published" | "cancelled" | "archived";
  registration_deadline: string | null;
  source?: "database" | "preview";
}

const previewEvents: EngagementEvent[] = [
  { id: "00000000-0000-0000-0000-000000000071", slug: "caregiver-peer-learning-lab", title: "Caregiver peer learning lab", summary: "A practical morning for sharing what helps care feel more possible.", description: "A facilitated learning circle for caregivers and community practitioners. We will trade practical tools, make room for lived expertise, and leave with one small next step each.", starts_at: "2026-11-21T07:00:00Z", ends_at: "2026-11-21T10:00:00Z", location: "Kisumu · venue shared after registration", capacity: 30, status: "published", registration_deadline: "2026-11-20T18:00:00Z", source: "preview" },
  { id: "00000000-0000-0000-0000-000000000072", slug: "maker-market-studio-session", title: "Maker market studio session", summary: "A working session on product readiness, pricing, and customer care.", description: "A focused studio session for supported makers building a clear, sustainable route from careful work to dependable sales.", starts_at: "2026-11-28T08:00:00Z", ends_at: "2026-11-28T11:00:00Z", location: "Online · link shared after registration", capacity: 25, status: "published", registration_deadline: "2026-11-27T18:00:00Z", source: "preview" },
  { id: "00000000-0000-0000-0000-000000000073", slug: "inclusive-practice-roundtable", title: "Inclusive practice roundtable", summary: "A cross-sector conversation about belonging, access, and useful partnership.", description: "A small roundtable for partners, volunteers, and practitioners who want to make inclusion a daily practice rather than a statement.", starts_at: "2026-12-05T08:00:00Z", ends_at: "2026-12-05T11:00:00Z", location: "Nairobi · invitation-led room", capacity: 40, status: "published", registration_deadline: "2026-12-04T18:00:00Z", source: "preview" },
];

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(value));
}

export async function getUpcomingEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("engagement_events").select("id, slug, title, summary, description, starts_at, ends_at, location, capacity, status, registration_deadline").eq("status", "published").order("starts_at");
  if (!error && data?.length) return data.map((event) => ({ ...event, source: "database" })) as EngagementEvent[];
  return previewEvents;
}

export async function getEngagementEvent(slug: string) {
  const events = await getUpcomingEvents();
  return events.find((event) => event.slug === slug) ?? null;
}
