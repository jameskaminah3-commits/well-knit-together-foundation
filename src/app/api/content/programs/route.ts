import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/auth/admin-access";
import { hasContentAccess } from "@/lib/auth/admin-access";

type ProgramPayload = { id?: string; slug?: string; title?: string; summary?: string; description?: string; counties?: string[]; focus_groups?: string[]; status?: "draft" | "published" | "archived"; seo_title?: string; seo_description?: string };

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasContentAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Content access requires an assigned editor role and a verified authenticator session." }, { status: 403 });
  const payload = await request.json().catch(() => null) as ProgramPayload | null;
  if (!payload?.slug || !payload.title || !payload.summary || !payload.description) return NextResponse.json({ error: "Slug, title, summary, and description are required." }, { status: 400 });

  const record = { slug: payload.slug.trim().toLowerCase(), title: payload.title.trim(), summary: payload.summary.trim(), description: payload.description.trim(), counties: payload.counties ?? [], focus_groups: payload.focus_groups ?? [], status: payload.status ?? "draft", seo_title: payload.seo_title?.trim() || null, seo_description: payload.seo_description?.trim() || null, created_by: actor.user.id, reviewed_by: payload.status === "published" ? actor.user.id : null, reviewed_at: payload.status === "published" ? new Date().toISOString() : null };
  const { data, error } = await actor.supabase.from("programs").insert(record).select("id").single();
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
  const record = { slug: payload.slug.trim().toLowerCase(), title: payload.title.trim(), summary: payload.summary.trim(), description: payload.description.trim(), counties: payload.counties ?? [], focus_groups: payload.focus_groups ?? [], status: payload.status ?? "draft", seo_title: payload.seo_title?.trim() || null, seo_description: payload.seo_description?.trim() || null, reviewed_by: payload.status === "published" ? actor.user.id : null, reviewed_at: payload.status === "published" ? new Date().toISOString() : null };
  const { error } = await actor.supabase.from("programs").update(record).eq("id", payload.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createRevision(actor.supabase, actor.user.id, "program", payload.id, record);
  return NextResponse.json({ ok: true });
}

async function createRevision(supabase: Awaited<ReturnType<typeof getAdminActor>>["supabase"], userId: string, entityType: "program", entityId: string, content: object) {
  const { data } = await supabase.from("content_revisions").select("version").eq("entity_type", entityType).eq("entity_id", entityId).order("version", { ascending: false }).limit(1).maybeSingle();
  await supabase.from("content_revisions").insert({ entity_type: entityType, entity_id: entityId, version: (data?.version ?? 0) + 1, content, created_by: userId });
}
