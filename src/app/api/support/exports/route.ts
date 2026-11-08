import { NextResponse } from "next/server";
import { getAdminActor, hasCaseAccess } from "@/lib/auth/admin-access";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasCaseAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified case-staff access is required." }, { status: 403 });
  const body = await request.json().catch(() => null) as { reason?: string } | null;
  const reason = body?.reason?.trim() ?? "";
  if (reason.length < 10 || reason.length > 500) return NextResponse.json({ error: "Explain the export purpose in 10 to 500 characters." }, { status: 400 });
  const { data, error } = await actor.supabase.from("support_export_requests").insert({ requested_by: actor.user.id, reason, filters: { fields: ["id", "county", "beneficiary_group", "need_category", "urgency", "status", "created_at", "assigned_to", "follow_up_at"] } }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
