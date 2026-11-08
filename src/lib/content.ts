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
  default_language?: "en" | "sw";
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
  default_language?: "en" | "sw";
}

export interface PublicContentItem {
  id: string;
  content_type: "news" | "event" | "report" | "resource";
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image_path: string | null;
  file_path: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

const programFields = "id, slug, title, summary, description, focus_groups, counties, image_path, seo_title, seo_description, default_language";
const storyFields = "id, slug, title, excerpt, body, image_path, published_at, seo_title, seo_description, default_language";
const contentFields = "id, content_type, slug, title, excerpt, body, image_path, file_path, location, starts_at, ends_at, published_at, seo_title, seo_description";

function isAvailable(record: { scheduled_for?: string | null }) {
  return !record.scheduled_for || new Date(record.scheduled_for).getTime() <= Date.now();
}

export async function getPublishedPrograms() {
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select(`${programFields}, scheduled_for`).eq("status", "published").eq("review_status", "approved").order("created_at");
  return (data ?? []).filter(isAvailable) as PublicProgram[];
}

export async function getPublishedProgram(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select(`${programFields}, scheduled_for`).eq("slug", slug).eq("status", "published").eq("review_status", "approved").maybeSingle();
  return data && isAvailable(data) ? data as PublicProgram : null;
}

export async function getPublishedStories() {
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select(`${storyFields}, scheduled_for`).eq("status", "published").eq("review_status", "approved").eq("consent_recorded", true).order("published_at", { ascending: false });
  return (data ?? []).filter(isAvailable) as PublicStory[];
}

export async function getPublishedStory(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select(`${storyFields}, scheduled_for`).eq("slug", slug).eq("status", "published").eq("review_status", "approved").eq("consent_recorded", true).maybeSingle();
  return data && isAvailable(data) ? data as PublicStory : null;
}

export async function getPublishedContentItems(contentType?: PublicContentItem["content_type"]) {
  const supabase = await createClient();
  let query = supabase.from("content_items").select(`${contentFields}, scheduled_for`).eq("status", "published").eq("review_status", "approved").order("published_at", { ascending: false });
  if (contentType) query = query.eq("content_type", contentType);
  const { data } = await query;
  return (data ?? []).filter(isAvailable) as PublicContentItem[];
}

export async function getPublishedContentItem(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("content_items").select(`${contentFields}, scheduled_for`).eq("slug", slug).eq("status", "published").eq("review_status", "approved").maybeSingle();
  return data && isAvailable(data) ? data as PublicContentItem : null;
}

export function getPublicMediaUrl(path: string | null) {
  if (!path) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url}/storage/v1/object/public/public-media/${path}` : null;
}
