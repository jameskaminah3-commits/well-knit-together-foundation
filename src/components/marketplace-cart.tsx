"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { availableStock, formatMarketplaceMoney, type MarketplaceProduct } from "@/lib/marketplace-shared";

interface MarketplaceCartProps {
  products: MarketplaceProduct[];
  preview: boolean;
}

export function MarketplaceCart({ products, preview }: MarketplaceCartProps) {
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
      setError("Local preview only: connect the Supabase project to create a real order intent.");
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
    const response = await fetch("/api/marketplace/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: selected.map((product) => ({ product_id: product.id, quantity: quantities[product.id] })),
        shippingDetails: shipping,
      }),
    });
    const result = await response.json().catch(() => null) as { orderId?: string; error?: string } | null;
    if (!response.ok) setError(result?.error ?? "We could not create the order intent.");
    else {
      setMessage(`Order intent created${result?.orderId ? ` · ${result.orderId.slice(0, 8)}` : ""}. Secure checkout will open when the payment provider is connected.`);
      setQuantities({});
    }
    setBusy(false);
  }

  return <div className="marketplace-cart-card">
    <div className="marketplace-cart-heading"><div><p className="eyebrow">Your bag</p><h3>{selected.length ? `${selected.length} ${selected.length === 1 ? "piece" : "pieces"}` : "Start with one piece"}</h3></div><span className="donation-currency">KES</span></div>
    <div className="cart-product-picker">{products.map((product) => <button className="cart-product-picker-row" type="button" key={product.id} onClick={() => add(product)} disabled={availableStock(product) < 1}><span>{product.name}</span><strong>{availableStock(product) ? "+ Add" : "Sold out"}</strong></button>)}</div>
    {selected.length ? <div className="cart-line-list">{selected.map((product) => <div className="cart-line" key={product.id}><div><strong>{product.name}</strong><span>{formatMarketplaceMoney(product.price)} each</span></div><div className="cart-quantity"><button type="button" onClick={() => remove(product)} aria-label={`Remove one ${product.name}`}>−</button><span>{quantities[product.id]}</span><button type="button" onClick={() => add(product)} aria-label={`Add one ${product.name}`}>+</button></div></div>)}</div> : <p className="muted">Choose a product and we’ll keep the next step simple.</p>}
    <div className="cart-total"><span>Estimated total</span><strong>{formatMarketplaceMoney(total)}</strong></div>
    <form className="marketplace-checkout-form" onSubmit={checkout}>
      <p className="form-note">Checkout reserves stock for 30 minutes. No card details are collected here.</p>
      <label>Name<input value={shipping.name} onChange={(event) => setShipping({ ...shipping, name: event.target.value })} placeholder="Your name" /></label>
      <label>Phone<input value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} placeholder="+254 …" /></label>
      <div className="form-two-col"><label>County<input value={shipping.county} onChange={(event) => setShipping({ ...shipping, county: event.target.value })} placeholder="County" /></label><label>Delivery address<input value={shipping.address} onChange={(event) => setShipping({ ...shipping, address: event.target.value })} placeholder="Town or address" /></label></div>
      {error && <p className="form-alert form-alert-error" role="alert">{error}</p>}
      {message && <p className="form-alert form-alert-success" role="status">{message}</p>}
      {preview ? <p className="form-note">Local preview mode. You can explore the full catalogue, but this environment will not record an order.</p> : <button className="button button-full" type="submit" disabled={busy}>{busy ? "Preparing order…" : "Continue to secure checkout"}</button>}
    </form>
    {!preview && <p className="form-note">Already have an account? <Link className="text-link" href="/login">Sign in</Link> to keep your order history together.</p>}
  </div>;
}
