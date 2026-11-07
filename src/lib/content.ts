import { createClient } from "@/lib/supabase/server";

export interface PublicProgram {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  focus_groups: string[];
  counties: string[];
  image_path: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface PublicStory {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image_path: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export async function getPublishedPrograms() {
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select("id, slug, title, summary, description, focus_groups, counties, image_path, seo_title, seo_description").eq("status", "published").order("created_at");
  return (data ?? []) as PublicProgram[];
}

export async function getPublishedProgram(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select("id, slug, title, summary, description, focus_groups, counties, image_path, seo_title, seo_description").eq("slug", slug).eq("status", "published").maybeSingle();
  return (data ?? null) as PublicProgram | null;
}

export async function getPublishedStories() {
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select("id, slug, title, excerpt, body, image_path, published_at, seo_title, seo_description").eq("status", "published").eq("consent_recorded", true).order("published_at", { ascending: false });
  return (data ?? []) as PublicStory[];
}

export async function getPublishedStory(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select("id, slug, title, excerpt, body, image_path, published_at, seo_title, seo_description").eq("slug", slug).eq("status", "published").eq("consent_recorded", true).maybeSingle();
  return (data ?? null) as PublicStory | null;
}
