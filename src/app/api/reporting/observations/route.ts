import { NextResponse } from "next/server";
import { getAdminActor, hasReportingAccess } from "@/lib/auth/admin-access";

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasReportingAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Verified reporting access required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const value = typeof payload?.value === "number" ? payload.value : Number(payload?.value);
  if (typeof payload?.program_indicator_id !== "string" || !Number.isFinite(value) || typeof payload.reporting_period_start !== "string" || typeof payload.reporting_period_end !== "string" || typeof payload.source !== "string" || !payload.source.trim()) return NextResponse.json({ error: "Indicator, period, value, and source are required." }, { status: 400 });
  const group = typeof payload.beneficiary_group === "string" && payload.beneficiary_group ? payload.beneficiary_group : null;
  const { data, error } = await actor.supabase.rpc("record_indicator_observation", { p_program_indicator_id: payload.program_indicator_id, p_county: typeof payload.county === "string" ? payload.county : null, p_beneficiary_group: group, p_reporting_period_start: payload.reporting_period_start, p_reporting_period_end: payload.reporting_period_end, p_value: value, p_source: payload.source, p_notes: typeof payload.notes === "string" ? payload.notes : "" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ ok: true, status: result?.validation_status, errors: result?.errors ?? [] }, { status: 201 });
}
