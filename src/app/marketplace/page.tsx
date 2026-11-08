import Link from "next/link";
import { MarketplaceCart } from "@/components/marketplace-cart";
import { availableStock, categoryLabel, formatMarketplaceMoney, getMarketplaceProducts } from "@/lib/marketplace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketplace" };

export default async function MarketplacePage() {
  const products = await getMarketplaceProducts();
  const preview = products[0]?.source === "preview";

  return <>
    <section className="page-hero marketplace-hero"><div className="container"><p className="eyebrow">Economic empowerment</p><h1>Objects with a wider circle of care.</h1><p>Shop small-batch pieces with clear maker context, considered fulfilment, and a direct connection to opportunity.</p></div></section>
    <section className="section"><div className="container marketplace-layout"><div><div className="section-heading"><p className="eyebrow">The maker edit</p><h2>Useful, beautiful, made with room to grow.</h2><p className="lead muted">A premium catalogue for work that deserves to be seen on its own terms. We share approved stories, never private case details.</p></div><div className="marketplace-grid">{products.map((product) => <article className="product-card" key={product.id}><div className={`product-art product-art-${product.category_slug}`} style={product.image_url ? { backgroundImage: `linear-gradient(180deg, rgba(20, 32, 35, .08), rgba(20, 32, 35, .62)), url(${product.image_url})` } : undefined}><span>{product.featured ? "Featured edit" : categoryLabel(product.category_slug)}</span><strong>{product.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</strong></div><div className="product-card-body"><div className="product-card-heading"><div><p className="eyebrow">{categoryLabel(product.category_slug)}</p><h3>{product.name}</h3></div><strong>{formatMarketplaceMoney(product.price, product.currency)}</strong></div><p>{product.short_description ?? product.description}</p><p className="maker-snippet">{product.maker_story}</p><div className="product-card-footer"><span>{availableStock(product)} available</span><Link className="card-link" href={`/marketplace/${product.slug}`}>View piece →</Link></div>{product.image_credit && <small className="image-credit">{product.image_credit}</small>}</div></article>)}</div>{preview && <p className="marketplace-preview-note">Local preview mode: the catalogue is reviewable here, while the connected Supabase project is required to reserve stock or create an order.</p>}</div><MarketplaceCart products={products} preview={preview} /></div></section>
    <section className="section soft-section"><div className="container info-grid"><article className="info-card"><p className="eyebrow">Dignity by design</p><h3>Maker stories stay purposeful.</h3><p>We describe the work, the craft, and the approved impact pathway—not private circumstances or rescue narratives.</p></article><article className="info-card"><p className="eyebrow">A calm checkout</p><h3>Reserve first. Pay securely.</h3><p>Stock reservations, provider checkout, fulfilment status, and support records are kept separate and auditable.</p></article></div></section>
  </>;
}
