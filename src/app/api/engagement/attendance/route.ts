import { NextResponse } from "next/server";
import { getAdminActor, hasEngagementAccess } from "@/lib/auth/admin-access";

const statuses = ["not_marked", "attended", "no_show", "cancelled"] as const;

export async function PATCH(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasEngagementAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified engagement access required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { registrationId?: unknown; status?: unknown; notes?: unknown } | null;
  if (typeof payload?.registrationId !== "string" || typeof payload.status !== "string" || !statuses.includes(payload.status as never)) return NextResponse.json({ error: "Registration and attendance status are required." }, { status: 400 });
  const { error } = await actor.supabase.from("event_attendance").upsert({ registration_id: payload.registrationId, attendance_status: payload.status, checked_in_at: payload.status === "attended" ? new Date().toISOString() : null, notes: typeof payload.notes === "string" ? payload.notes.trim() : "", marked_by: actor.user.id }, { onConflict: "registration_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
