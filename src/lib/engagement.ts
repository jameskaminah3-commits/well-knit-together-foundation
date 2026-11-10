import { createClient } from "@/lib/supabase/server";
import { previewContentAllowed } from "@/lib/site";

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

const eventFields = "id, slug, title, summary, description, starts_at, ends_at, location, capacity, status, registration_deadline";

function daysFromNow(days: number, hourUtc: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hourUtc, 0, 0, 0);
  return date.toISOString();
}

/** Local design-review samples. Never shown in production. */
function previewEvents(): EngagementEvent[] {
  return [
    { id: "00000000-0000-0000-0000-000000000071", slug: "caregiver-peer-learning-lab", title: "Caregiver peer learning circle (sample)", summary: "A practical morning for sharing what helps care feel more possible.", description: "Sample event for local review only.", starts_at: daysFromNow(14, 7), ends_at: daysFromNow(14, 10), location: "Mombasa · venue shared after registration", capacity: 30, status: "published", registration_deadline: daysFromNow(13, 15), source: "preview" },
    { id: "00000000-0000-0000-0000-000000000072", slug: "maker-market-studio-session", title: "Maker market studio session (sample)", summary: "A working session on product readiness, pricing, and customer care.", description: "Sample event for local review only.", starts_at: daysFromNow(21, 8), ends_at: daysFromNow(21, 11), location: "Kilifi · venue shared after registration", capacity: 25, status: "published", registration_deadline: daysFromNow(20, 15), source: "preview" },
  ];
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(value));
}

export function eventHasEnded(event: Pick<EngagementEvent, "starts_at" | "ends_at">) {
  return new Date(event.ends_at ?? event.starts_at).getTime() < Date.now();
}

export function registrationOpen(event: EngagementEvent) {
  if (event.source === "preview" || event.status !== "published" || eventHasEnded(event)) return false;
  return !event.registration_deadline || new Date(event.registration_deadline).getTime() > Date.now();
}

export async function getUpcomingEvents(): Promise<EngagementEvent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("engagement_events").select(eventFields).eq("status", "published").order("starts_at");
    if (!error && data) {
      const upcoming = (data as EngagementEvent[]).filter((event) => !eventHasEnded(event)).map((event) => ({ ...event, source: "database" as const }));
      if (upcoming.length || !previewContentAllowed()) return upcoming;
    }
  } catch {
    // Fall through to preview content in local development only.
  }
  return previewContentAllowed() ? previewEvents() : [];
}

export async function getEngagementEvent(slug: string): Promise<EngagementEvent | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("engagement_events").select(eventFields).eq("slug", slug).in("status", ["published", "cancelled"]).maybeSingle();
    if (!error && data) return { ...(data as EngagementEvent), source: "database" };
  } catch {
    // Fall through to preview content in local development only.
  }
  return previewContentAllowed() ? previewEvents().find((event) => event.slug === slug) ?? null : null;
}
