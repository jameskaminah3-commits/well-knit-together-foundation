import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, isValidEmail, requestKey } from "@/lib/security/rate-limit";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { applicationReceived } from "@/lib/email/templates";

export async function POST(request: Request) {
  const rate = consumeRateLimit(requestKey(request, "volunteer-application"), 3);
  if (!rate.allowed) return Response.json({ error: "Please wait before sending another application." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const required = ["name", "email", "skills", "availability"];
  if (!body || required.some((key) => typeof body[key] !== "string" || !(body[key] as string).trim()) || body.consent_recorded !== true) return Response.json({ error: "Complete the required fields and consent before submitting." }, { status: 400 });
  const name = String(body.name).trim(); const email = String(body.email).trim().toLowerCase(); const skills = String(body.skills).trim(); const availability = String(body.availability).trim(); const county = typeof body.county === "string" ? body.county.trim() : null;
  if (name.length > 120 || !isValidEmail(email) || skills.length < 10 || skills.length > 1000 || availability.length > 200 || (county && county.length > 100)) return Response.json({ error: "Check the length of the details and enter a valid email." }, { status: 400 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("volunteer_applications").insert({ applicant_id: user?.id ?? null, name, email, county, skills, availability, consent_recorded: true, status: "pending" }).select("id").single();
  if (error) return Response.json({ error: "We could not save the application. Please try again." }, { status: 400 });
  const reference = data.id.slice(0, 8).toUpperCase();
  const emailContent = applicationReceived({ kind: "volunteer", name, reference });
  await deliverTransactionalEmail({ messageType: "volunteer_application_received", to: email, subject: emailContent.subject, html: emailContent.html, text: emailContent.text, recipientUserId: user?.id, dedupeKey: `volunteer-application-received:${data.id}` });
  return Response.json({ reference, status: "pending" }, { status: 201 });
}
