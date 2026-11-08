import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/auth/admin-access";
import { hasContentAccess } from "@/lib/auth/admin-access";

type ProgramPayload = { id?: string; slug?: string; title?: string; summary?: string; description?: string; counties?: string[]; focus_groups?: string[]; status?: "draft" | "pending_review" | "published" | "archived"; scheduled_for?: string | null; default_language?: "en" | "sw"; seo_title?: string; seo_description?: string };

function editorialState(status: ProgramPayload["status"] = "draft") {
  if (status === "pending_review" || status === "published") return { status: "draft" as const, review_status: "pending_review" as const };
  return { status: status as "draft" | "archived", review_status: status === "archived" ? "draft" as const : "draft" as const };
}

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasContentAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Content access requires an assigned editor role and a verified authenticator session." }, { status: 403 });
  const payload = await request.json().catch(() => null) as ProgramPayload | null;
  if (!payload?.slug || !payload.title || !payload.summary || !payload.description) return NextResponse.json({ error: "Slug, title, summary, and description are required." }, { status: 400 });

  const state = editorialState(payload.status);
  const record = { slug: payload.slug.trim().toLowerCase(), title: payload.title.trim(), summary: payload.summary.trim(), description: payload.description.trim(), counties: payload.counties ?? [], focus_groups: payload.focus_groups ?? [], ...state, default_language: payload.default_language ?? "en", scheduled_for: payload.scheduled_for || null, seo_title: payload.seo_title?.trim() || null, seo_description: payload.seo_description?.trim() || null, created_by: actor.user.id };
  const { data, error } = await actor.supabase.from("programs").insert(record as never).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createRevision(actor.supabase, actor.user.id, "program", data.id, record);
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasContentAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Content access requires an assigned editor role and a verified authenticator session." }, { status: 403 });
  const payload = await request.json().catch(() => null) as ProgramPayload | null;
  if (!payload?.id || !payload.slug || !payload.title || !payload.summary || !payload.description) return NextResponse.json({ error: "Program id, slug, title, summary, and description are required." }, { status: 400 });
  const state = editorialState(payload.status);
  const record = { slug: payload.slug.trim().toLowerCase(), title: payload.title.trim(), summary: payload.summary.trim(), description: payload.description.trim(), counties: payload.counties ?? [], focus_groups: payload.focus_groups ?? [], ...state, default_language: payload.default_language ?? "en", scheduled_for: payload.scheduled_for || null, seo_title: payload.seo_title?.trim() || null, seo_description: payload.seo_description?.trim() || null };
  const { error } = await actor.supabase.from("programs").update(record as never).eq("id", payload.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createRevision(actor.supabase, actor.user.id, "program", payload.id, record);
  return NextResponse.json({ ok: true });
}

async function createRevision(supabase: Awaited<ReturnType<typeof getAdminActor>>["supabase"], userId: string, entityType: "program", entityId: string, content: object) {
  const { data } = await supabase.from("content_revisions").select("version").eq("entity_type", entityType).eq("entity_id", entityId).order("version", { ascending: false }).limit(1).maybeSingle();
  await supabase.from("content_revisions").insert({ entity_type: entityType, entity_id: entityId, version: (data?.version ?? 0) + 1, content, created_by: userId });
}
