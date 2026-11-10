"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { availableStock, formatMarketplaceMoney, type MarketplaceProduct } from "@/lib/marketplace-shared";

interface MarketplaceCartProps {
  products: MarketplaceProduct[];
  preview: boolean;
  signedIn: boolean;
  checkoutEnabled: boolean;
}

export function MarketplaceCart({ products, preview, signedIn, checkoutEnabled }: MarketplaceCartProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [shipping, setShipping] = useState({ name: "", phone: "", county: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(() => products.filter((product) => (quantities[product.id] ?? 0) > 0), [products, quantities]);
  const total = selected.reduce((sum, product) => sum + product.price * (quantities[product.id] ?? 0), 0);

  function add(product: MarketplaceProduct) {
    setError("");
    setQuantities((current) => ({ ...current, [product.id]: Math.min(availableStock(product), (current[product.id] ?? 0) + 1) }));
  }

  function remove(product: MarketplaceProduct) {
    setQuantities((current) => {
      const next = { ...current };
      const quantity = (next[product.id] ?? 0) - 1;
      if (quantity > 0) next[product.id] = quantity;
      else delete next[product.id];
      return next;
    });
  }

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    if (preview) {
      setError("Local preview only: connect Supabase to create a real order.");
      setBusy(false);
      return;
    }
    if (!selected.length) {
      setError("Add at least one product to your bag.");
      setBusy(false);
      return;
    }
    if (!shipping.name || !shipping.phone || !shipping.county || !shipping.address) {
      setError("Add your name, phone, county, and delivery address to continue.");
      setBusy(false);
      return;
    }
    let response: Response;
    try {
      response = await fetch("/api/marketplace/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: selected.map((product) => ({ product_id: product.id, quantity: quantities[product.id] })),
        shippingDetails: shipping,
      }),
      });
    } catch {
      setError("You appear to be offline. Please check your connection and try again.");
      setBusy(false);
      return;
    }
    const result = await response.json().catch(() => null) as { orderId?: string; error?: string } | null;
    if (!response.ok) setError(result?.error ?? "We could not create the order intent.");
    else {
      setMessage(`Order received${result?.orderId ? ` · reference ${result.orderId.slice(0, 8).toUpperCase()}` : ""}. We will contact you to confirm payment and delivery.`);
      setQuantities({});
    }
    setBusy(false);
  }

  return <div className="marketplace-cart-card">
    <div className="marketplace-cart-heading"><div><p className="eyebrow">Your bag</p><h3>{selected.length ? `${selected.length} ${selected.length === 1 ? "piece" : "pieces"}` : "Start with one piece"}</h3></div><span className="donation-currency">KES</span></div>
    <div className="cart-product-picker">{products.map((product) => <button className="cart-product-picker-row" type="button" key={product.id} onClick={() => add(product)} disabled={availableStock(product) < 1}><span>{product.name}</span><strong>{availableStock(product) ? "+ Add" : "Sold out"}</strong></button>)}</div>
    {selected.length ? <div className="cart-line-list">{selected.map((product) => <div className="cart-line" key={product.id}><div><strong>{product.name}</strong><span>{formatMarketplaceMoney(product.price)} each</span></div><div className="cart-quantity"><button type="button" onClick={() => remove(product)} aria-label={`Remove one ${product.name}`}>−</button><span>{quantities[product.id]}</span><button type="button" onClick={() => add(product)} aria-label={`Add one ${product.name}`}>+</button></div></div>)}</div> : <p className="muted">Choose a product and we’ll keep the next step simple.</p>}
    <div className="cart-total"><span>Estimated total</span><strong>{formatMarketplaceMoney(total)}</strong></div>
    {preview ? <p className="form-note">Local preview: you can explore the catalogue, but this environment will not record an order.</p>
      : !checkoutEnabled ? <div className="notice-card"><strong>Online checkout is opening soon.</strong><p>To order now, <Link className="text-link" href="/contact">contact us</Link> with the pieces you would like and we will arrange payment and delivery.</p></div>
      : !signedIn ? <div className="notice-card"><strong>Sign in to check out.</strong><p>An account keeps your order and delivery updates in one place. <Link className="text-link" href="/login?next=/marketplace">Sign in</Link> or <Link className="text-link" href="/signup">create an account</Link>.</p></div>
      : <form className="marketplace-checkout-form" onSubmit={checkout}>
      <p className="form-note">Checkout holds your pieces for 30 minutes. No card details are collected here.</p>
      <label>Name<input autoComplete="name" value={shipping.name} onChange={(event) => setShipping({ ...shipping, name: event.target.value })} placeholder="Your name" /></label>
      <label>Phone<input type="tel" inputMode="tel" autoComplete="tel" value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} placeholder="07XX XXX XXX" /></label>
      <div className="form-two-col"><label>County<input autoComplete="address-level1" value={shipping.county} onChange={(event) => setShipping({ ...shipping, county: event.target.value })} placeholder="County" /></label><label>Delivery address<input autoComplete="street-address" value={shipping.address} onChange={(event) => setShipping({ ...shipping, address: event.target.value })} placeholder="Town or address" /></label></div>
      {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
      {message && <p className="form-alert form-alert-success" role="status">{message}</p>}
      <button className="button button-full" type="submit" disabled={busy}>{busy ? "Preparing order…" : "Continue to secure checkout"}</button>
    </form>}
  </div>;
}
