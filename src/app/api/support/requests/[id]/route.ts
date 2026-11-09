import { NextResponse } from "next/server";
import { getAdminActor, hasCaseAccess } from "@/lib/auth/admin-access";
import { supportStatuses } from "@/lib/support";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { supportStatusUpdate } from "@/lib/email/templates";

type UpdatePayload = {
  status?: string;
  assigned_to?: string | null;
  follow_up_at?: string | null;
  closure_reason?: string | null;
  safeguarding_flag?: boolean;
  safeguarding_summary?: string | null;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasCaseAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified case-staff access is required." }, { status: 403 });
  const { id } = await context.params;
  const payload = await request.json().catch(() => null) as UpdatePayload | null;
  if (!payload || (payload.status && !supportStatuses.includes(payload.status as never))) return NextResponse.json({ error: "Choose a valid case status." }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (payload.status) update.status = payload.status;
  if (payload.assigned_to !== undefined) update.assigned_to = payload.assigned_to === "me" ? actor.user.id : payload.assigned_to || null;
  if (payload.follow_up_at !== undefined) update.follow_up_at = payload.follow_up_at || null;
  if (payload.closure_reason !== undefined) update.closure_reason = payload.closure_reason?.trim().slice(0, 500) || null;
  if (payload.safeguarding_flag !== undefined) update.safeguarding_flag = payload.safeguarding_flag;
  if (payload.safeguarding_summary !== undefined) update.safeguarding_summary = payload.safeguarding_summary?.trim().slice(0, 1000) || null;
  if (!Object.keys(update).length) return NextResponse.json({ error: "No case changes were supplied." }, { status: 400 });
  if (update.safeguarding_flag === true && !update.safeguarding_summary) return NextResponse.json({ error: "Add a brief safeguarding summary before flagging the case." }, { status: 400 });

  const { data: current, error: currentError } = await actor.supabase.from("support_requests").select("id, status, contact_email, consent_to_contact, preferred_contact_method, requester_id").eq("id", id).maybeSingle();
  if (currentError || !current) return NextResponse.json({ error: "The support request could not be found." }, { status: 404 });
  const { error } = await actor.supabase.from("support_requests").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (typeof update.status === "string" && update.status !== current.status && current.consent_to_contact && current.preferred_contact_method === "email" && current.contact_email) {
    const email = supportStatusUpdate({ reference: id.slice(0, 8).toUpperCase(), status: update.status });
    await deliverTransactionalEmail({ messageType: "support_request_status", to: current.contact_email, subject: email.subject, html: email.html, text: email.text, recipientUserId: current.requester_id, dedupeKey: `support-request-status:${id}:${update.status}` });
  }
  return NextResponse.json({ ok: true });
}
