import type { Metadata } from "next";
import Link from "next/link";
import { BrandArt } from "@/components/brand-art";
import { MarketplaceCart } from "@/components/marketplace-cart";
import { availableStock, categoryLabel, formatMarketplaceMoney, getMarketplaceProducts } from "@/lib/marketplace";
import { onlinePaymentsEnabled } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop goods made by caregivers", description: "Handmade goods from caregivers in our skills and livelihoods program. Every purchase supports an income that fits around care.", alternates: { canonical: "/marketplace" } };

async function isSignedIn() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

export default async function MarketplacePage() {
  const [products, signedIn] = await Promise.all([getMarketplaceProducts(), isSignedIn()]);
  const preview = products[0]?.source === "preview";

  return <>
    <section className="page-hero marketplace-hero"><div className="container"><p className="eyebrow">Economic empowerment</p><h1>Made by caregivers. Bought by people who care.</h1><p>The shop connects caregiver-makers in our skills and livelihoods program with buyers, so their work earns a fair, dependable income that fits around care.</p></div></section>
    {products.length ? (
      <section className="section"><div className="container marketplace-layout"><div><div className="section-heading"><p className="eyebrow">The maker collection</p><h2>Useful, beautiful, made with room to grow.</h2><p className="lead muted">We share each maker’s story with their permission—never private case details.</p></div><div className="marketplace-grid">{products.map((product) => <article className="product-card" key={product.id}><div className={`product-art product-art-${product.category_slug}`} style={product.image_url ? { backgroundImage: `linear-gradient(180deg, rgba(20, 32, 35, .08), rgba(20, 32, 35, .62)), url(${JSON.stringify(product.image_url)})` } : undefined} role="img" aria-label={product.name}><span>{product.featured ? "Featured" : categoryLabel(product.category_slug)}</span><strong aria-hidden="true">{product.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</strong></div><div className="product-card-body"><div className="product-card-heading"><div><p className="eyebrow">{categoryLabel(product.category_slug)}</p><h3>{product.name}</h3></div><strong>{formatMarketplaceMoney(product.price, product.currency)}</strong></div><p>{product.short_description ?? product.description}</p>{product.maker_story && <p className="maker-snippet">{product.maker_story}</p>}<div className="product-card-footer"><span>{availableStock(product) ? `${availableStock(product)} available` : "Sold out"}</span><Link className="card-link" href={`/marketplace/${product.slug}`}>View piece →</Link></div></div></article>)}</div>{preview && <p className="marketplace-preview-note">Local preview: these are sample listings. Production shows only approved products from the connected catalogue.</p>}</div><MarketplaceCart products={products} preview={preview} signedIn={signedIn} checkoutEnabled={onlinePaymentsEnabled()} /></div></section>
    ) : (
      <section className="section"><div className="container split"><div className="home-photo-stack" style={{ minHeight: 420 }}><figure className="home-photo home-photo-main"><BrandArt className="visual-art" variant="weave" label="Woven pattern artwork" /></figure></div><div><p className="eyebrow">Opening soon</p><h2>The maker collection is being prepared.</h2><p className="lead muted">Caregivers in our skills and livelihoods program are getting their first products ready. We list a piece only when the maker has approved its story, its price is fair, and we can deliver it reliably.</p><p className="muted">Looking for corporate gifts, event hampers, or a bulk order? We would love to talk.</p><div className="button-row"><Link className="button" href="/engage/partner">Enquire about orders</Link><Link className="button button-secondary" href="/donate">Support a maker’s training</Link></div></div></div></section>
    )}
    <section className="section soft-section"><div className="container info-grid"><article className="info-card"><p className="eyebrow">Dignity by design</p><h3>Maker stories stay purposeful.</h3><p>We describe the work, the craft, and the impact pathway—not private circumstances or rescue narratives.</p></article><article className="info-card"><p className="eyebrow">Fair and transparent</p><h3>Income that reaches the maker.</h3><p>Prices are agreed with makers, and stock, orders, and fulfilment are recorded so every sale can be accounted for.</p></article></div></section>
  </>;
}
