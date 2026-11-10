import { createClient } from "@/lib/supabase/server";
import { previewContentAllowed } from "@/lib/site";
import type { MarketplaceProduct } from "@/lib/marketplace-shared";
export type { MarketplaceProduct } from "@/lib/marketplace-shared";
export { availableStock, categoryLabel, formatMarketplaceMoney } from "@/lib/marketplace-shared";

const previewProducts: MarketplaceProduct[] = [
  {
    id: "00000000-0000-0000-0000-000000000061",
    slug: "woven-warmth-basket",
    name: "Woven warmth basket",
    description: "A structured handwoven basket with a quiet, natural finish for keeping everyday essentials close.",
    short_description: "A considered basket for the rhythm of everyday life.",
    maker_story: "Sample listing for local review: made by a caregiver maker group, where shared production helps women build confidence, income, and room to plan ahead.",
    impact_note: "Every purchase contributes to dependable market access and maker income.",
    price: 3200,
    currency: "KES",
    stock_quantity: 12,
    reserved_quantity: 0,
    status: "active",
    category_slug: "home",
    featured: true,
    image_url: null,
    image_credit: null,
    source: "preview",
  },
  {
    id: "00000000-0000-0000-0000-000000000062",
    slug: "indigo-table-runner",
    name: "Indigo table runner",
    description: "A hand-finished runner in deep indigo and soft natural tones, designed to settle beautifully into a shared table.",
    short_description: "A slow-made layer for shared meals and meaningful rooms.",
    maker_story: "The collective’s textile work creates a place to learn, make, and earn together without reducing makers to a single story.",
    impact_note: "Sales support skills, materials, and fairer routes to market.",
    price: 2800,
    currency: "KES",
    stock_quantity: 9,
    reserved_quantity: 0,
    status: "active",
    category_slug: "home",
    featured: true,
    image_url: null,
    image_credit: null,
    source: "preview",
  },
  {
    id: "00000000-0000-0000-0000-000000000063",
    slug: "seed-bead-statement-necklace",
    name: "Seed bead statement necklace",
    description: "A light, graphic necklace made in a small palette of warm earth and green tones.",
    short_description: "A small statement with a generous connection behind it.",
    maker_story: "Each piece is made in small batches, giving the collective space to protect quality and grow at a humane pace.",
    impact_note: "Your order helps keep creative work visible, valued, and connected to customers.",
    price: 1800,
    currency: "KES",
    stock_quantity: 18,
    reserved_quantity: 0,
    status: "active",
    category_slug: "wearables",
    featured: false,
    image_url: null,
    image_credit: null,
    source: "preview",
  },
];

export async function getMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, description, short_description, maker_story, impact_note, price, currency, stock_quantity, reserved_quantity, status, category_slug, featured, image_url, image_credit")
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error && data?.length) return data.map((product) => ({ ...product, source: "database" })) as MarketplaceProduct[];
  } catch {
    // Fall through to local preview content in development only.
  }
  return previewContentAllowed() ? previewProducts : [];
}

export async function getMarketplaceProduct(slug: string) {
  const products = await getMarketplaceProducts();
  return products.find((product) => product.slug === slug) ?? null;
}
