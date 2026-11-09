import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, isValidEmail, requestKey } from "@/lib/security/rate-limit";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { eventRegistration } from "@/lib/email/templates";

export async function POST(request: Request) {
  const rate = consumeRateLimit(requestKey(request, "event-registration"), 5);
  if (!rate.allowed) return Response.json({ error: "Please wait before registering again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as { event_id?: unknown; name?: unknown; email?: unknown } | null;
  if (!body || typeof body.event_id !== "string" || typeof body.name !== "string" || typeof body.email !== "string" || !body.name.trim() || !body.email.trim()) return Response.json({ error: "Name and email are required." }, { status: 400 });
  if (body.name.trim().length > 120 || !isValidEmail(body.email.trim().toLowerCase())) return Response.json({ error: "Enter a valid name and email." }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_for_engagement_event", { p_event_id: body.event_id, p_name: body.name.trim(), p_email: body.email.trim().toLowerCase() });
  if (error) return Response.json({ error: "We could not complete registration. The event may be full or closed." }, { status: 400 });
  const registration = Array.isArray(data) ? data[0] : data;
  const { data: event } = await supabase.from("engagement_events").select("title, starts_at, location").eq("id", body.event_id).maybeSingle();
  if (registration?.registration_id && event) {
    const emailContent = eventRegistration({ name: body.name.trim(), eventTitle: event.title, status: registration.registration_status, startsAt: event.starts_at, location: event.location, reference: registration.registration_id.slice(0, 8).toUpperCase() });
    await deliverTransactionalEmail({ messageType: "event_registration", to: body.email.trim().toLowerCase(), subject: emailContent.subject, html: emailContent.html, text: emailContent.text, dedupeKey: `event-registration:${registration.registration_id}` });
  }
  return Response.json({ registrationId: registration?.registration_id, status: registration?.registration_status }, { status: 201 });
}
