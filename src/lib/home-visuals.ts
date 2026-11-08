import { createClient } from "@/lib/supabase/server";
import { foundationVisuals } from "@/lib/site";
import { getPublicMediaUrl } from "@/lib/content";

type HomeVisualPlacement = "home_hero" | "home_story_main" | "home_story_support";

export async function getFoundationVisuals() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("media_assets").select("placement, storage_path, alt_text, file_name").eq("entity_type", "homepage").eq("bucket_id", "public-media").eq("status", "approved").eq("consent_recorded", true).in("placement", ["home_hero", "home_story_main", "home_story_support"]);
  if (error || !data?.length) return foundationVisuals;

  const overrides = new Map<HomeVisualPlacement, { src: string; alt: string; credit: string }>();
  for (const asset of data) {
    const placement = asset.placement as HomeVisualPlacement;
    const src = getPublicMediaUrl(asset.storage_path);
    if (src && !overrides.has(placement)) overrides.set(placement, { src, alt: asset.alt_text, credit: `Approved media library · ${asset.file_name}` });
  }
  const placements: HomeVisualPlacement[] = ["home_hero", "home_story_main", "home_story_support"];
  return foundationVisuals.map((visual, index) => ({ ...visual, ...(overrides.get(placements[index]) ?? {}) }));
}
