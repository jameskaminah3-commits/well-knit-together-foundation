import { NextResponse } from "next/server";
import { getAdminActor, hasEngagementAccess } from "@/lib/auth/admin-access";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasEngagementAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified engagement access required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const audienceType = typeof payload?.audience_type === "string" ? payload.audience_type : "";
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";
  if (!["all", "role", "county", "program"].includes(audienceType) || !title || body.length < 10 || (audienceType !== "all" && typeof payload?.audience_key !== "string")) return NextResponse.json({ error: "Choose a segment and provide a title and message." }, { status: 400 });
  const { data, error } = await actor.supabase.from("engagement_notifications").insert({ audience_type: audienceType, audience_key: audienceType === "all" ? null : String(payload?.audience_key).trim(), title, body, status: payload?.status === "scheduled" ? "scheduled" : "sent", scheduled_for: typeof payload?.scheduled_for === "string" ? payload.scheduled_for : null, created_by: actor.user.id, sent_at: payload?.status === "scheduled" ? null : new Date().toISOString() }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
