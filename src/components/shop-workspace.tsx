"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: string; name: string; price: number; stock_quantity: number; reserved_quantity: number; status: string; featured: boolean; category_slug: string };
type Order = { id: string; status: string; total_amount: number; customer_email: string; created_at: string; fulfilment_note: string | null; items: string };

async function send(method: string, body: object) {
  const response = await fetch("/api/shop", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The change could not be saved.");
}

const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

export function ShopWorkspace({ products, orders, canEditProducts }: { products: Product[]; orders: Order[]; canEditProducts: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true); setNotice(""); setError("");
    try { await action(); setNotice(success); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "The change could not be saved."); }
    finally { setBusy(false); }
  }

  function saveProduct(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(() => send("PATCH", { type: "product", id, price: Number(data.get("price")), stock_quantity: Number(data.get("stock_quantity")), status: data.get("status"), featured: data.get("featured") === "on" }), "Product updated.");
  }

  function saveOrder(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(() => send("PATCH", { type: "order", id, status: data.get("status"), note: data.get("note") }), "Order updated and stock adjusted.");
  }

  function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement));
    void run(async () => { await send("POST", { ...data, price: Number(data.price), stock_quantity: Number(data.stock_quantity) }); formElement.reset(); }, "Product added as a draft. Set it to active when the photo and story are approved.");
  }

  return <div className="settings-stack">
    {(notice || error) && <p className={`form-alert ${error ? "form-alert-error" : "form-alert-success"}`} role={error ? "alert" : "status"}>{error || notice}</p>}

    <section>
      <div className="content-section-heading"><div><p className="eyebrow">Orders</p><h3>Fulfilment queue</h3></div><span className="form-note">Paid, processing, and fulfilled take stock off the shelf. Cancelled releases it.</span></div>
      <div className="table-scroll"><table className="workspace-table"><thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Status and note</th></tr></thead><tbody>
        {orders.map((order) => <tr key={order.id}><td><strong>{order.id.slice(0, 8).toUpperCase()}</strong><br /><small className="muted">{order.customer_email}<br />{new Date(order.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}</small></td><td>{order.items}</td><td>{money(Number(order.total_amount))}</td><td>
          <form className="inline-form" onSubmit={(event) => saveOrder(event, order.id)}><select name="status" defaultValue={order.status} disabled={busy || ["fulfilled", "cancelled", "refunded"].includes(order.status) && order.status !== "fulfilled"}>{["pending", "paid", "processing", "fulfilled", "cancelled", "refunded"].map((status) => <option key={status}>{status}</option>)}</select><input name="note" defaultValue={order.fulfilment_note ?? ""} placeholder="Delivery or payment note" /><button className="button button-small" disabled={busy}>Save</button></form>
        </td></tr>)}
        {!orders.length && <tr><td colSpan={4} className="muted">No orders yet.</td></tr>}
      </tbody></table></div>
    </section>

    {canEditProducts && <section>
      <div className="content-section-heading"><div><p className="eyebrow">Products</p><h3>Catalogue, prices, and stock</h3></div></div>
      <div className="table-scroll"><table className="workspace-table"><thead><tr><th>Product</th><th>Price (KES)</th><th>Stock</th><th>Status</th><th>Featured</th><th></th></tr></thead><tbody>
        {products.map((product) => <tr key={product.id}><td colSpan={6} style={{ padding: 0 }}><form className="inline-form" style={{ padding: "10px", display: "grid", gridTemplateColumns: "minmax(160px, 2fr) 110px 90px 120px 70px auto", gap: 10, alignItems: "center" }} onSubmit={(event) => saveProduct(event, product.id)}>
          <span><strong>{product.name}</strong><br /><small className="muted">{product.category_slug}{product.reserved_quantity ? ` · ${product.reserved_quantity} reserved` : ""}</small></span>
          <input name="price" type="number" min="0" step="1" defaultValue={product.price} aria-label={`Price for ${product.name}`} />
          <input name="stock_quantity" type="number" min="0" step="1" defaultValue={product.stock_quantity} aria-label={`Stock for ${product.name}`} />
          <select name="status" defaultValue={product.status === "out_of_stock" ? "active" : product.status} aria-label={`Status for ${product.name}`}><option value="draft">draft</option><option value="active">active</option><option value="archived">archived</option></select>
          <input name="featured" type="checkbox" defaultChecked={product.featured} aria-label={`Feature ${product.name}`} style={{ width: 20, minWidth: 0 }} />
          <button className="button button-small" disabled={busy}>Save</button>
        </form></td></tr>)}
      </tbody></table></div>
      <details className="content-editor" style={{ marginTop: 18 }}><summary>Add a product</summary>
        <form className="content-form settings-form" onSubmit={addProduct}>
          <div className="form-two-col"><label>Name<input name="name" required minLength={3} maxLength={120} /></label><label>Category<select name="category_slug" defaultValue="home"><option value="home">Home and living</option><option value="wearables">Wearables</option><option value="gifts">Gifts</option></select></label></div>
          <div className="form-two-col"><label>Price (KES)<input name="price" type="number" min="0" step="1" required /></label><label>Stock<input name="stock_quantity" type="number" min="0" step="1" required /></label></div>
          <label>Short description<input name="short_description" maxLength={160} /></label>
          <label>Description<textarea name="description" rows={3} required minLength={10} /></label>
          <label>Maker story (with the maker’s consent)<textarea name="maker_story" rows={2} /></label>
          <button className="button button-small" disabled={busy}>Add as draft</button>
        </form>
      </details>
    </section>}
  </div>;
}
