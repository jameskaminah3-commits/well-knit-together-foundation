export interface MarketplaceProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  short_description: string | null;
  maker_story: string | null;
  impact_note: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  reserved_quantity: number;
  status: "draft" | "active" | "out_of_stock" | "archived";
  category_slug: string;
  featured: boolean;
  image_url: string | null;
  image_credit: string | null;
  source?: "database" | "preview";
}

export function formatMarketplaceMoney(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function categoryLabel(slug: string) {
  return ({ home: "Home and living", wearables: "Wearables", gifts: "Gifts with meaning" } as Record<string, string>)[slug] ?? "Small-batch goods";
}

export function availableStock(product: Pick<MarketplaceProduct, "stock_quantity" | "reserved_quantity">) {
  return Math.max(0, product.stock_quantity - product.reserved_quantity);
}
