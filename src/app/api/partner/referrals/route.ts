import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/auth/admin-access";

/** A partner accepts, declines, or completes a referral sent to their organisation. */
export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!actor.roles.includes("partner")) return NextResponse.json({ error: "Partner access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as { referralId?: unknown; status?: unknown; outcome?: unknown } | null;
  if (typeof body?.referralId !== "string" || typeof body.status !== "string" || !["accepted", "declined", "completed"].includes(body.status)) return NextResponse.json({ error: "Choose a referral and a response." }, { status: 400 });
  const outcome = typeof body.outcome === "string" ? body.outcome.trim().slice(0, 1000) : "";
  if (body.status !== "accepted" && outcome.length < 5) return NextResponse.json({ error: "Add a short note so the foundation knows what happened." }, { status: 400 });
  const { error } = await actor.supabase.rpc("partner_update_referral", { p_referral_id: body.referralId, p_status: body.status, p_outcome: outcome || null });
  if (error) return NextResponse.json({ error: error.message.includes("closed") ? "This referral is already closed." : "This referral could not be updated." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
