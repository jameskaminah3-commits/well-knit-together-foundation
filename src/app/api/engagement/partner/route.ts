import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, isValidEmail, requestKey } from "@/lib/security/rate-limit";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { applicationReceived } from "@/lib/email/templates";

export async function POST(request: Request) {
  const rate = consumeRateLimit(requestKey(request, "partner-application"), 3);
  if (!rate.allowed) return Response.json({ error: "Please wait before sending another application." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const required = ["organization_name", "contact_name", "contact_email", "focus_area", "counties", "notes"];
  if (!body || required.some((key) => typeof body[key] !== "string" || !(body[key] as string).trim()) || body.consent_recorded !== true) return Response.json({ error: "Complete the required fields and consent before submitting." }, { status: 400 });
  const organization = String(body.organization_name).trim(); const contact = String(body.contact_name).trim(); const email = String(body.contact_email).trim().toLowerCase(); const counties = String(body.counties).trim(); const notes = String(body.notes).trim();
  if (organization.length > 160 || contact.length > 120 || counties.length > 500 || notes.length < 20 || notes.length > 2000 || !isValidEmail(email)) return Response.json({ error: "Check the length of the details and enter a valid contact email." }, { status: 400 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("partner_applications").insert({ applicant_id: user?.id ?? null, organization_name: organization, contact_name: contact, contact_email: email, focus_area: String(body.focus_area).trim(), counties: counties.split(",").map((county) => county.trim()).filter(Boolean).slice(0, 20), notes, consent_recorded: true, status: "pending" }).select("id").single();
  if (error) return Response.json({ error: "We could not save the application. Please try again." }, { status: 400 });
  const reference = data.id.slice(0, 8).toUpperCase();
  const emailContent = applicationReceived({ kind: "partner", name: contact, reference });
  await deliverTransactionalEmail({ messageType: "partner_application_received", to: email, subject: emailContent.subject, html: emailContent.html, text: emailContent.text, recipientUserId: user?.id, dedupeKey: `partner-application-received:${data.id}` });
  return Response.json({ reference, status: "pending" }, { status: 201 });
}
