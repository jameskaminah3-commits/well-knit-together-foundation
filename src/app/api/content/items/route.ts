import { NextResponse } from "next/server";
import { getAdminActor, hasContentAccess } from "@/lib/auth/admin-access";

type ContentPayload = { id?: string; content_type?: "news" | "event" | "report" | "resource"; slug?: string; title?: string; excerpt?: string; body?: string; status?: "draft" | "pending_review" | "published" | "archived"; location?: string; starts_at?: string | null; ends_at?: string | null; scheduled_for?: string | null; file_path?: string | null; seo_title?: string; seo_description?: string };

function state(status: ContentPayload["status"] = "draft") {
  if (status === "pending_review" || status === "published") return { status: "draft" as const, review_status: "pending_review" as const };
  return { status: status as "draft" | "archived", review_status: "draft" as const };
}

function record(payload: ContentPayload, userId?: string) {
  return { content_type: payload.content_type, slug: payload.slug?.trim().toLowerCase(), title: payload.title?.trim(), excerpt: payload.excerpt?.trim(), body: payload.body?.trim(), ...state(payload.status), location: payload.location?.trim() || null, starts_at: payload.starts_at || null, ends_at: payload.ends_at || null, scheduled_for: payload.scheduled_for || null, file_path: payload.file_path || null, seo_title: payload.seo_title?.trim() || null, seo_description: payload.seo_description?.trim() || null, ...(userId ? { created_by: userId } : {}) };
}

async function authorize() {
  const actor = await getAdminActor();
  if (!actor.user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }), actor };
  if (!hasContentAccess(actor.roles, actor.assuranceLevel)) return { response: NextResponse.json({ error: "Content access requires an assigned editor role and a verified authenticator session." }, { status: 403 }), actor };
  return { response: null, actor };
}

export async function POST(request: Request) {
  const { response, actor } = await authorize();
  if (response) return response;
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const payload = await request.json().catch(() => null) as ContentPayload | null;
  if (!payload?.content_type || !payload.slug || !payload.title || !payload.excerpt || !payload.body) return NextResponse.json({ error: "Type, slug, title, excerpt, and body are required." }, { status: 400 });
  const { data, error } = await actor.supabase.from("content_items").insert(record(payload, actor.user.id) as never).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createRevision(actor.supabase, actor.user.id, data.id, record(payload));
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: Request) {
  const { response, actor } = await authorize();
  if (response) return response;
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const payload = await request.json().catch(() => null) as ContentPayload | null;
  if (!payload?.id || !payload.content_type || !payload.slug || !payload.title || !payload.excerpt || !payload.body) return NextResponse.json({ error: "Item id, type, slug, title, excerpt, and body are required." }, { status: 400 });
  const next = record(payload);
  const { error } = await actor.supabase.from("content_items").update(next as never).eq("id", payload.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createRevision(actor.supabase, actor.user.id, payload.id, next);
  return NextResponse.json({ ok: true });
}

async function createRevision(supabase: Awaited<ReturnType<typeof getAdminActor>>["supabase"], userId: string, entityId: string, content: object) {
  const { data } = await supabase.from("content_revisions").select("version").eq("entity_type", "content_item").eq("entity_id", entityId).order("version", { ascending: false }).limit(1).maybeSingle();
  await supabase.from("content_revisions").insert({ entity_type: "content_item", entity_id: entityId, version: (data?.version ?? 0) + 1, content, created_by: userId });
}
