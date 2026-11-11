import { NextResponse } from "next/server";
import { getAdminActor, hasAdminAccess } from "@/lib/auth/admin-access";

const tables = { program: "programs", story: "stories", content_item: "content_items" } as const;

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasAdminAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Only an AAL2 administrator can approve content." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { entityType?: keyof typeof tables; entityId?: string; decision?: "approve" | "reject" } | null;
  if (!payload?.entityType || !payload.entityId || !payload.decision || !tables[payload.entityType]) return NextResponse.json({ error: "Entity and review decision are required." }, { status: 400 });

  const table = tables[payload.entityType];
  if (payload.entityType === "story" && payload.decision === "approve") {
    const { data } = await actor.supabase.from(table).select("consent_recorded").eq("id", payload.entityId).maybeSingle();
    if (!data?.consent_recorded) return NextResponse.json({ error: "This story cannot be approved without recorded consent." }, { status: 400 });
  }
  const approved = payload.decision === "approve";
  // Programmes have no published_at column; setting it made every programme approval fail.
  const stampsPublication = payload.entityType !== "program";
  const update = { review_status: approved ? "approved" : "rejected", status: approved ? "published" : "draft", reviewed_by: actor.user.id, reviewed_at: new Date().toISOString(), ...(approved && stampsPublication ? { published_at: new Date().toISOString() } : {}) };
  const { error } = await actor.supabase.from(table).update(update).eq("id", payload.entityId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
