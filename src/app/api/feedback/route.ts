import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, requestKey } from "@/lib/security/rate-limit";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { feedbackReceived } from "@/lib/email/templates";

const areas = ["website", "support", "events", "marketplace", "giving", "workspace", "other"] as const;

export async function POST(request: Request) {
  const rate = consumeRateLimit(requestKey(request, "feedback"), 3);
  if (!rate.allowed) return NextResponse.json({ error: "Please wait before sending more feedback." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const area = typeof payload?.area === "string" ? payload.area : "";
  const rating = Number(payload?.rating);
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";
  const contactEmail = typeof payload?.contact_email === "string" ? payload.contact_email.trim().toLowerCase() : null;
  if (!areas.includes(area as never) || !Number.isInteger(rating) || rating < 1 || rating > 5 || message.length < 10 || message.length > 2000 || payload?.consent_recorded !== true) {
    return NextResponse.json({ error: "Choose an area, rating, and a message of at least 10 characters. Consent is required." }, { status: 400 });
  }
  if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) return NextResponse.json({ error: "Enter a valid email or leave it blank." }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("site_feedback").insert({ area, rating, message, contact_email: contactEmail, consent_recorded: true }).select("id").single();
  if (error) return NextResponse.json({ error: "We could not save your feedback. Please try again." }, { status: 400 });
  const reference = `FB-${data.id.slice(0, 8).toUpperCase()}`;
  if (contactEmail) {
    const email = feedbackReceived(reference);
    await deliverTransactionalEmail({ messageType: "feedback_received", to: contactEmail, subject: email.subject, html: email.html, text: email.text, dedupeKey: `feedback-received:${data.id}` });
  }
  return NextResponse.json({ ok: true, reference }, { status: 201 });
}
