import { NextResponse } from "next/server";
import { getAdminActor, hasExportApprovalAccess } from "@/lib/auth/admin-access";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasExportApprovalAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Only an AAL2 administrator can approve exports." }, { status: 403 });
  const { id } = await context.params;
  const { error } = await actor.supabase.from("support_export_requests").update({ status: "approved", approved_by: actor.user.id, approved_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() }).eq("id", id).eq("status", "pending");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
