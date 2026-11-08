import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const required = ["name", "email", "skills", "availability"];
  if (!body || required.some((key) => typeof body[key] !== "string" || !(body[key] as string).trim()) || body.consent_recorded !== true) return Response.json({ error: "Complete the required fields and consent before submitting." }, { status: 400 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("volunteer_applications").insert({ applicant_id: user?.id ?? null, name: (body.name as string).trim(), email: (body.email as string).trim().toLowerCase(), county: typeof body.county === "string" ? body.county.trim() : null, skills: (body.skills as string).trim(), availability: (body.availability as string).trim(), consent_recorded: true, status: "pending" }).select("id").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ reference: data.id.slice(0, 8), status: "pending" }, { status: 201 });
}
