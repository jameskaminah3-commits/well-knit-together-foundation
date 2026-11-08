import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMarketplaceMoney } from "@/lib/marketplace-shared";

export const metadata = { title: "My orders" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders } = user ? await supabase.from("orders").select("id, status, total_amount, currency, created_at").eq("customer_id", user.id).order("created_at", { ascending: false }) : { data: [] };
  const orderIds = (orders ?? []).map((order) => order.id);
  const { data: items } = orderIds.length ? await supabase.from("order_items").select("order_id, product_name_snapshot, quantity, unit_price, line_total").in("order_id", orderIds) : { data: [] };
  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items ?? []) itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), item]);

  return <section className="dashboard-page narrow-page"><div className="dashboard-heading"><div><p className="eyebrow">Your orders</p><h1>Made to be followed through.</h1><p className="lead muted">Keep your order intent, fulfilment status, and support path together.</p></div><Link className="button button-secondary" href="/marketplace">Browse pieces</Link></div><div className="dashboard-notice"><div><strong>Secure checkout boundary.</strong><p>Payment details stay with the provider. This workspace holds order and fulfilment status only.</p></div></div><div className="order-history">{orders?.length ? orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-heading"><div><p className="eyebrow">Order {order.id.slice(0, 8)}</p><h3>{formatMarketplaceMoney(Number(order.total_amount), order.currency)}</h3><p className="form-note">{new Date(order.created_at).toLocaleDateString()}</p></div><span className={`status-badge status-${order.status}`}>{order.status}</span></div><div className="order-items">{(itemsByOrder.get(order.id) ?? []).map((item) => <div className="order-item" key={`${order.id}-${item.product_name_snapshot}`}><span>{item.product_name_snapshot} × {item.quantity}</span><strong>{formatMarketplaceMoney(Number(item.line_total ?? item.unit_price * item.quantity), order.currency)}</strong></div>)}</div></article>) : <div className="empty-state"><h3>Your order history will appear here.</h3><p className="muted">Start with a piece from the maker edit.</p><Link className="button" href="/marketplace">Explore the marketplace</Link></div>}</div></section>;
}
