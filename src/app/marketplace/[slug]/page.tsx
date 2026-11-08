import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketplaceCart } from "@/components/marketplace-cart";
import { categoryLabel, formatMarketplaceMoney, getMarketplaceProduct } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getMarketplaceProduct(slug);
  return { title: product?.name ?? "Marketplace piece", description: product?.short_description ?? product?.description };
}

export default async function MarketplaceProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getMarketplaceProduct(slug);
  if (!product) notFound();
  const preview = product.source === "preview";

  return <section className="section"><div className="container product-detail"><div><Link className="text-link" href="/marketplace">← Back to marketplace</Link><div className={`product-art product-art-large product-art-${product.category_slug}`} style={product.image_url ? { backgroundImage: `linear-gradient(180deg, rgba(20, 32, 35, .08), rgba(20, 32, 35, .62)), url(${product.image_url})` } : undefined}><span>{categoryLabel(product.category_slug)}</span><strong>{product.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</strong></div>{product.image_credit && <p className="image-credit">{product.image_credit}</p>}</div><div className="product-detail-copy"><p className="eyebrow">{categoryLabel(product.category_slug)}</p><h1>{product.name}</h1><p className="lead muted">{product.description}</p><p className="product-price">{formatMarketplaceMoney(product.price, product.currency)}</p><div className="detail-divider" /><p className="eyebrow">Maker story</p><p>{product.maker_story}</p><div className="impact-callout"><strong>{product.impact_note}</strong><span>Approved impact messaging · {product.source === "database" ? "connected catalogue" : "local preview"}</span></div><MarketplaceCart products={[product]} preview={preview} /></div></div></section>;
}
