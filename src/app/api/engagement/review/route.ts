import { NextResponse } from "next/server";
import { getAdminActor, hasEngagementAccess } from "@/lib/auth/admin-access";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { applicationStatusUpdate } from "@/lib/email/templates";

const applicationStatuses = ["pending", "in_review", "approved", "declined", "archived"] as const;
const dueDiligenceStatuses = ["pending", "in_review", "cleared", "needs_follow_up", "declined"] as const;

export async function PATCH(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasEngagementAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified engagement access required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload?.entityType || typeof payload.id !== "string") return NextResponse.json({ error: "A review entity and id are required." }, { status: 400 });

  if (payload.entityType === "partner" || payload.entityType === "volunteer") {
    const status = typeof payload.status === "string" ? payload.status : "";
    if (!applicationStatuses.includes(status as never)) return NextResponse.json({ error: "Unsupported application status." }, { status: 400 });
    const table = payload.entityType === "partner" ? "partner_applications" : "volunteer_applications";
    const { data: applicationRow, error: fetchError } = await actor.supabase.from(table).select(payload.entityType === "partner" ? "id, contact_name, contact_email, applicant_id, status" : "id, name, email, applicant_id, status").eq("id", payload.id).maybeSingle();
    const application = applicationRow as { id: string; applicant_id: string | null; status: string; contact_name?: string; contact_email?: string; name?: string; email?: string } | null;
    if (fetchError || !application) return NextResponse.json({ error: "The application could not be found." }, { status: 404 });
    const { error } = await actor.supabase.from(table).update({ status, updated_at: new Date().toISOString() }).eq("id", payload.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await actor.supabase.from("audit_logs").insert({ actor_id: actor.user.id, action: "engagement_application_status_changed", entity_type: table, entity_id: payload.id, metadata: { status } });
    const recipient = payload.entityType === "partner" ? application.contact_email : application.email;
    const name = payload.entityType === "partner" ? application.contact_name : application.name;
    if (application.status !== status && recipient && name) {
      const email = applicationStatusUpdate({ kind: payload.entityType, name, status, reference: String(application.id).slice(0, 8).toUpperCase() });
      await deliverTransactionalEmail({ messageType: `${payload.entityType}_application_status`, to: recipient, subject: email.subject, html: email.html, text: email.text, recipientUserId: application.applicant_id, dedupeKey: `${payload.entityType}-application-status:${application.id}:${status}` });
    }
    return NextResponse.json({ ok: true });
  }

  if (payload.entityType === "due_diligence") {
    const status = typeof payload.status === "string" ? payload.status : "pending";
    if (!dueDiligenceStatuses.includes(status as never)) return NextResponse.json({ error: "Unsupported due-diligence status." }, { status: 400 });
    const checks = typeof payload.checks === "object" && payload.checks !== null ? payload.checks : {};
    const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";
    const { error } = await actor.supabase.from("partner_due_diligence").upsert({ partner_application_id: payload.id, verification_status: status, checks, notes, reviewed_by: actor.user.id, reviewed_at: new Date().toISOString() }, { onConflict: "partner_application_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await actor.supabase.from("audit_logs").insert({ actor_id: actor.user.id, action: "partner_due_diligence_updated", entity_type: "partner_application", entity_id: payload.id, metadata: { status } });
    return NextResponse.json({ ok: true });
  }

  if (payload.entityType === "partner_assignment") {
    if (typeof payload.programId !== "string") return NextResponse.json({ error: "A program is required." }, { status: 400 });
    const { error } = await actor.supabase.from("partner_program_assignments").upsert({ partner_application_id: payload.id, program_id: payload.programId, assignment_status: "active", assigned_by: actor.user.id }, { onConflict: "partner_application_id,program_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (payload.entityType === "volunteer_assignment") {
    const { error } = await actor.supabase.from("volunteer_assignments").insert({ volunteer_application_id: payload.id, program_id: typeof payload.programId === "string" ? payload.programId : null, assignment_status: "active", notes: typeof payload.notes === "string" ? payload.notes.trim() : "", assigned_by: actor.user.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported review entity." }, { status: 400 });
}
