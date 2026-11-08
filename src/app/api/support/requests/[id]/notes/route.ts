import { NextResponse } from "next/server";
import { getAdminActor, hasCaseAccess } from "@/lib/auth/admin-access";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasCaseAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified case-staff access is required." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { note?: string } | null;
  const note = body?.note?.trim() ?? "";
  if (!note || note.length > 4000) return NextResponse.json({ error: "Add an internal note of up to 4,000 characters." }, { status: 400 });
  const { error } = await actor.supabase.from("support_request_notes").insert({ support_request_id: id, author_id: actor.user.id, note, is_internal: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
