import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/auth/admin-access";

const orderStatuses = ["pending", "paid", "processing", "fulfilled", "cancelled", "refunded"] as const;
const productStatuses = ["draft", "active", "archived"] as const;
const categories = ["home", "wearables", "gifts"] as const;

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

/** Shop operations. Database policies decide who may change what; this route validates input. */
export async function PATCH(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "Choose an order or product." }, { status: 400 });

  if (body.type === "order") {
    const status = typeof body.status === "string" && orderStatuses.includes(body.status as never) ? body.status : null;
    if (!status) return NextResponse.json({ error: "Choose a valid order status." }, { status: 400 });
    const note = typeof body.note === "string" ? body.note.slice(0, 500) : "";
    const { error } = await actor.supabase.rpc("set_marketplace_order_status", { p_order_id: body.id, p_status: status, p_note: note });
    if (error) return NextResponse.json({ error: error.message.includes("access") ? "Verified shop or finance access is required." : error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.type === "product") {
    const price = Number(body.price);
    const stock = Number(body.stock_quantity);
    const status = typeof body.status === "string" && productStatuses.includes(body.status as never) ? body.status : null;
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !status) return NextResponse.json({ error: "Enter a price, a whole-number stock count, and a status." }, { status: 400 });
    const { data, error } = await actor.supabase.from("products").update({ price, stock_quantity: stock, status, featured: body.featured === true, updated_at: new Date().toISOString() }).eq("id", body.id).select("id");
    if (error || !data?.length) return NextResponse.json({ error: "Verified shop access is required to edit products." }, { status: 403 });
    await actor.supabase.from("audit_logs").insert({ actor_id: actor.user.id, action: "product_updated", entity_type: "product", entity_id: body.id, metadata: { price, stock_quantity: stock, status } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported change." }, { status: 400 });
}

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 2000) : "";
  const price = Number(body?.price);
  const stock = Number(body?.stock_quantity);
  const category = typeof body?.category_slug === "string" && categories.includes(body.category_slug as never) ? body.category_slug : "home";
  if (name.length < 3 || description.length < 10 || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Add a name, a description of at least 10 characters, a price, and a stock count." }, { status: 400 });
  const { data, error } = await actor.supabase.from("products").insert({
    slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 4)}`, name, description,
    short_description: typeof body?.short_description === "string" ? body.short_description.trim().slice(0, 160) || null : null,
    maker_story: typeof body?.maker_story === "string" ? body.maker_story.trim().slice(0, 600) || null : null,
    price, stock_quantity: stock, status: "draft", category_slug: category, currency: "KES", created_by: actor.user.id,
  }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Verified shop access is required to add products." }, { status: 403 });
  await actor.supabase.from("audit_logs").insert({ actor_id: actor.user.id, action: "product_created", entity_type: "product", entity_id: data.id, metadata: { name } });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
