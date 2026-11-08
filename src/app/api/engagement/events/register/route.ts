import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { event_id?: unknown; name?: unknown; email?: unknown } | null;
  if (!body || typeof body.event_id !== "string" || typeof body.name !== "string" || typeof body.email !== "string" || !body.name.trim() || !body.email.trim()) return Response.json({ error: "Name and email are required." }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_for_engagement_event", { p_event_id: body.event_id, p_name: body.name.trim(), p_email: body.email.trim().toLowerCase() });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const registration = Array.isArray(data) ? data[0] : data;
  return Response.json({ registrationId: registration?.registration_id, status: registration?.registration_status }, { status: 201 });
}
