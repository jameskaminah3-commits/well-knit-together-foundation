import { NextResponse } from "next/server";
import { getAdminActor, hasReportingAccess } from "@/lib/auth/admin-access";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasReportingAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified reporting access required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const value = Number(payload?.value);
  if (!payload || typeof payload.metric_key !== "string" || typeof payload.label !== "string" || !Number.isFinite(value) || typeof payload.unit !== "string" || typeof payload.period_label !== "string") return NextResponse.json({ error: "Metric key, label, value, unit, and period are required." }, { status: 400 });
  const { data, error } = await actor.supabase.from("public_impact_metrics").insert({ metric_key: payload.metric_key.trim(), label: payload.label.trim(), value, unit: payload.unit.trim(), period_label: payload.period_label.trim(), county: typeof payload.county === "string" ? payload.county.trim() || null : null, beneficiary_group: typeof payload.beneficiary_group === "string" && payload.beneficiary_group ? payload.beneficiary_group : null, public_note: typeof payload.public_note === "string" ? payload.public_note.trim() : "", program_id: typeof payload.program_id === "string" && payload.program_id ? payload.program_id : null, source_observation_ids: Array.isArray(payload.source_observation_ids) ? payload.source_observation_ids.filter((item): item is string => typeof item === "string") : [], status: "draft", created_by: actor.user.id }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasReportingAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified reporting access required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
  if (typeof payload?.id !== "string" || !["approved", "archived", "draft"].includes(String(payload.status))) return NextResponse.json({ error: "Metric id and valid status are required." }, { status: 400 });
  const status = String(payload.status);
  const { error } = await actor.supabase.from("public_impact_metrics").update({ status, approved_by: status === "approved" ? actor.user.id : null, approved_at: status === "approved" ? new Date().toISOString() : null }).eq("id", payload.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await actor.supabase.from("audit_logs").insert({ actor_id: actor.user.id, action: "public_impact_metric_status_changed", entity_type: "public_impact_metric", entity_id: payload.id, metadata: { status } });
  return NextResponse.json({ ok: true });
}
