import { NextResponse } from "next/server";
import { getAdminActor, hasCaseAccess } from "@/lib/auth/admin-access";
import { consumeRateLimit, isValidEmail, requestKey } from "@/lib/security/rate-limit";
import { beneficiaryGroups, needCategories, urgencyOptions } from "@/lib/support";
import type { BeneficiaryGroup } from "@/types/domain";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { supportReceived } from "@/lib/email/templates";

type SupportPayload = {
  beneficiary_group?: BeneficiaryGroup;
  county?: string;
  need_category?: string;
  urgency?: string;
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  preferred_contact_method?: string;
  preferred_contact_window?: string;
  consent_to_contact?: boolean;
  safeguarding_concern?: boolean;
  submission_channel?: string;
};

const groups: Set<string> = new Set(beneficiaryGroups.map((group) => group.value));
const needs: Set<string> = new Set(needCategories.map(([value]) => value));
const urgencies: Set<string> = new Set(urgencyOptions.map(([value]) => value));
const contactMethods: Set<string> = new Set(["phone", "email", "sms", "whatsapp", "none"]);

export async function POST(request: Request) {
  const rate = consumeRateLimit(requestKey(request, "support-request"), 5);
  if (!rate.allowed) return NextResponse.json({ error: "Please wait before sending another request." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const actor = await getAdminActor();
  const payload = await request.json().catch(() => null) as SupportPayload | null;
  const description = payload?.description?.trim() ?? "";
  const county = payload?.county?.trim() ?? "";
  const beneficiaryGroup = payload?.beneficiary_group;
  const needCategory = payload?.need_category ?? "other";
  const urgency = payload?.urgency ?? "normal";
  const consentToContact = payload?.consent_to_contact === true;
  const requestedChannel = payload?.submission_channel ?? "web";

  if (!beneficiaryGroup || !groups.has(beneficiaryGroup) || !county || county.length > 100 || !needs.has(needCategory) || !urgencies.has(urgency)) {
    return NextResponse.json({ error: "Choose a valid population, county, need, and urgency." }, { status: 400 });
  }
  if (description.length < 10 || description.length > 2000) {
    return NextResponse.json({ error: "Please describe the support needed in 10 to 2,000 characters." }, { status: 400 });
  }
  if (requestedChannel === "assisted" && (!actor.user || !hasCaseAccess(actor.roles, actor.assuranceLevel))) {
    return NextResponse.json({ error: "Assisted submissions require verified case-staff access." }, { status: 403 });
  }
  if (consentToContact && (!payload?.preferred_contact_method || !contactMethods.has(payload.preferred_contact_method) || payload.preferred_contact_method === "none")) {
    return NextResponse.json({ error: "Choose a preferred contact method when giving contact consent." }, { status: 400 });
  }
  if (payload?.contact_email && (typeof payload.contact_email !== "string" || !isValidEmail(payload.contact_email.trim()) || payload.contact_email.trim().length > 254)) return NextResponse.json({ error: "Enter a valid contact email or leave it blank." }, { status: 400 });

  const authenticatedChannel = requestedChannel === "assisted" ? "assisted" : actor.user ? "account" : "web";
  const record = {
    requester_id: actor.user?.id ?? null,
    beneficiary_group: beneficiaryGroup,
    county,
    subject: `Support request: ${needCategories.find(([value]) => value === needCategory)?.[1] ?? "General support"}`,
    description,
    status: "new",
    confidential: true,
    need_category: needCategory,
    urgency,
    consent_to_contact: consentToContact,
    contact_name: consentToContact ? payload?.contact_name?.trim().slice(0, 120) || null : null,
    contact_email: consentToContact ? payload?.contact_email?.trim().slice(0, 254) || null : null,
    contact_phone: consentToContact ? payload?.contact_phone?.trim().slice(0, 40) || null : null,
    preferred_contact_method: consentToContact ? payload?.preferred_contact_method : "none",
    preferred_contact_window: consentToContact ? payload?.preferred_contact_window?.trim().slice(0, 120) || null : null,
    safeguarding_concern: payload?.safeguarding_concern === true,
    submission_channel: authenticatedChannel,
  };

  const { data, error } = await actor.supabase.from("support_requests").insert(record as never).select("id").single();
  if (error) return NextResponse.json({ error: "We could not save the request. Please try again or contact the foundation directly." }, { status: 400 });
  const reference = data.id.slice(0, 8).toUpperCase();
  if (consentToContact && record.contact_email && record.preferred_contact_method === "email") {
    const email = supportReceived(reference);
    await deliverTransactionalEmail({ messageType: "support_request_received", to: record.contact_email, subject: email.subject, html: email.html, text: email.text, dedupeKey: `support-request-received:${data.id}` });
  }
  return NextResponse.json({ ok: true, id: data.id, reference }, { status: 201 });
}
