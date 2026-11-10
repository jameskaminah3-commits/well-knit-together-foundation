import { createClient } from "@/lib/supabase/server";
import { foundationVisuals, type FoundationVisual } from "@/lib/site";
import { getPublicMediaUrl } from "@/lib/content";

type HomeVisualPlacement = "home_hero" | "home_story_main" | "home_story_support";

const placements: HomeVisualPlacement[] = ["home_hero", "home_story_main", "home_story_support"];

/**
 * Returns approved, consented homepage photographs from the media library.
 * Any placement without an approved photo falls back to original artwork.
 */
export async function getFoundationVisuals(): Promise<FoundationVisual[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("media_assets")
      .select("placement, storage_path, alt_text, file_name")
      .eq("entity_type", "homepage")
      .eq("bucket_id", "public-media")
      .eq("status", "approved")
      .eq("consent_recorded", true)
      .in("placement", placements);
    if (error || !data?.length) return foundationVisuals;

    const overrides = new Map<HomeVisualPlacement, Pick<FoundationVisual, "src" | "alt" | "credit">>();
    for (const asset of data) {
      const placement = asset.placement as HomeVisualPlacement;
      const src = getPublicMediaUrl(asset.storage_path);
      if (src && !overrides.has(placement)) overrides.set(placement, { src, alt: asset.alt_text, credit: null });
    }
    return foundationVisuals.map((visual, index) => ({ ...visual, ...(overrides.get(placements[index]) ?? {}) }));
  } catch {
    return foundationVisuals;
  }
}
