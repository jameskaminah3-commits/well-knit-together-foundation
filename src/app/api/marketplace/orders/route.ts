import { createClient } from "@/lib/supabase/server";
import { deliverTransactionalEmail } from "@/lib/email/service";
import { orderCreated } from "@/lib/email/templates";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in before starting checkout." }, { status: 401 });
  if (process.env.NODE_ENV === "production" && process.env.PAYMENT_PROVIDER_ENABLED !== "true") return Response.json({ error: "Secure checkout is temporarily unavailable. Please try again later." }, { status: 503 });

  const body = await request.json().catch(() => null) as { items?: unknown; shippingDetails?: unknown } | null;
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length || items.some((item) => !item || typeof item !== "object" || typeof (item as { product_id?: unknown }).product_id !== "string" || !Number.isInteger((item as { quantity?: unknown }).quantity) || Number((item as { quantity?: number }).quantity) < 1 || Number((item as { quantity?: number }).quantity) > 20)) {
    return Response.json({ error: "Choose at least one valid product." }, { status: 400 });
  }
  const shippingDetails = body?.shippingDetails;
  if (!shippingDetails || typeof shippingDetails !== "object") return Response.json({ error: "Delivery details are required." }, { status: 400 });

  const { data: orderId, error } = await supabase.rpc("create_marketplace_order", {
    p_items: items,
    p_shipping_details: shippingDetails,
  });
  if (error) return Response.json({ error: "We could not start checkout. Please review the items and try again." }, { status: 400 });
  const { data: order } = await supabase.from("orders").select("id, customer_email, total_amount, currency").eq("id", orderId).maybeSingle();
  if (order) {
    const email = orderCreated({ orderId: order.id, total: Number(order.total_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 }), currency: order.currency });
    await deliverTransactionalEmail({ messageType: "order_created", to: order.customer_email, subject: email.subject, html: email.html, text: email.text, dedupeKey: `order-created:${order.id}`, recipientUserId: user.id });
  }
  return Response.json({ orderId, status: "pending", message: "Order intent created. Secure checkout will open when the payment provider is connected." }, { status: 201 });
}
