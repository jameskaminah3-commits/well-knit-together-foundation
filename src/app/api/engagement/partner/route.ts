import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const required = ["organization_name", "contact_name", "contact_email", "focus_area", "counties", "notes"];
  if (!body || required.some((key) => typeof body[key] !== "string" || !(body[key] as string).trim()) || body.consent_recorded !== true) return Response.json({ error: "Complete the required fields and consent before submitting." }, { status: 400 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("partner_applications").insert({ applicant_id: user?.id ?? null, organization_name: (body.organization_name as string).trim(), contact_name: (body.contact_name as string).trim(), contact_email: (body.contact_email as string).trim().toLowerCase(), focus_area: (body.focus_area as string).trim(), counties: (body.counties as string).split(",").map((county) => county.trim()).filter(Boolean), notes: (body.notes as string).trim(), consent_recorded: true, status: "pending" }).select("id").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ reference: data.id.slice(0, 8), status: "pending" }, { status: 201 });
}
