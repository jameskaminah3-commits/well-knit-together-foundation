import { NextResponse } from "next/server";
import { getAdminActor, hasCaseAccess } from "@/lib/auth/admin-access";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasCaseAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified case-staff access is required." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { partner_name?: string; partner_contact?: string; response_due_at?: string | null } | null;
  const partnerName = body?.partner_name?.trim() ?? "";
  if (partnerName.length < 2 || partnerName.length > 160) return NextResponse.json({ error: "Add the referral partner name." }, { status: 400 });
  const { error } = await actor.supabase.from("support_referrals").insert({ support_request_id: id, partner_name: partnerName, partner_contact: body?.partner_contact?.trim().slice(0, 300) || null, response_due_at: body?.response_due_at || null, created_by: actor.user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await actor.supabase.from("support_requests").update({ status: "referred" }).eq("id", id);
  return NextResponse.json({ ok: true });
}
