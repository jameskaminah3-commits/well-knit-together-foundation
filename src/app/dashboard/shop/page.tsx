import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopWorkspace } from "@/components/shop-workspace";
import { getAdminActor } from "@/lib/auth/admin-access";

export const metadata = { title: "Shop workspace" };
export const dynamic = "force-dynamic";

export default async function ShopWorkspacePage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/shop");
  const verified = actor.assuranceLevel === "aal2";
  const canEditProducts = verified && actor.roles.some((role) => ["marketplace_manager", "admin", "superadmin"].includes(role));
  const canManageOrders = verified && actor.roles.some((role) => ["marketplace_manager", "finance", "admin", "superadmin"].includes(role));
  if (!canManageOrders) return <section className="dashboard-page narrow-page"><p className="eyebrow">Shop workspace</p><h1>Verified shop or finance access required.</h1><p className="lead muted">Orders and products are managed by the marketplace manager, finance, and administrators with two-step verification.</p><Link className="button" href="/dashboard/security">Open security settings</Link></section>;

  const [{ data: products }, { data: orders }, { data: items }] = await Promise.all([
    actor.supabase.from("products").select("id, name, price, stock_quantity, reserved_quantity, status, featured, category_slug").order("featured", { ascending: false }).order("name"),
    actor.supabase.from("orders").select("id, status, total_amount, customer_email, created_at, fulfilment_note").order("created_at", { ascending: false }).limit(50),
    actor.supabase.from("order_items").select("order_id, product_name_snapshot, quantity"),
  ]);
  const itemsByOrder = new Map<string, string[]>();
  for (const item of items ?? []) itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), `${item.quantity} × ${item.product_name_snapshot ?? "item"}`]);
  const orderRows = (orders ?? []).map((order) => ({ ...order, total_amount: Number(order.total_amount), items: (itemsByOrder.get(order.id) ?? []).join(", ") || "—" }));
  const open = orderRows.filter((order) => ["pending", "paid", "processing"].includes(order.status));

  return <section className="dashboard-page">
    <div className="dashboard-heading"><div><p className="eyebrow">Shop</p><h1>Made with care, delivered with care.</h1><p className="lead muted">Move orders from paid to delivered, keep stock honest, and manage the makers’ catalogue.</p></div><Link className="button button-secondary" href="/marketplace">View the shop</Link></div>
    <div className="finance-metrics">
      <article className="info-card"><p className="eyebrow">Open orders</p><h3>{open.length}</h3><p className="muted">Pending, paid, or being prepared</p></article>
      <article className="info-card"><p className="eyebrow">Active products</p><h3>{(products ?? []).filter((product) => product.status === "active").length}</h3><p className="muted">Visible in the shop</p></article>
      <article className="info-card"><p className="eyebrow">Low stock</p><h3>{(products ?? []).filter((product) => product.status === "active" && product.stock_quantity - product.reserved_quantity <= 3).length}</h3><p className="muted">Three or fewer available</p></article>
    </div>
    <ShopWorkspace products={(products ?? []).map((product) => ({ ...product, price: Number(product.price) }))} orders={orderRows} canEditProducts={canEditProducts} />
  </section>;
}
