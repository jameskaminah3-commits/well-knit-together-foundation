import { NextResponse } from "next/server";
import { getAdminActor, hasContentAccess } from "@/lib/auth/admin-access";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasContentAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Content access requires an assigned editor role and a verified authenticator session." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { entity_type?: "program" | "story" | "content_item"; entity_id?: string; language?: "en" | "sw"; title?: string; summary?: string; body?: string; seo_title?: string; seo_description?: string } | null;
  if (!payload?.entity_type || !payload.entity_id || !payload.language || !payload.title) return NextResponse.json({ error: "Entity, language, and title are required." }, { status: 400 });
  const { error } = await actor.supabase.from("content_localizations").upsert({ ...payload, created_by: actor.user.id }, { onConflict: "entity_type,entity_id,language" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
