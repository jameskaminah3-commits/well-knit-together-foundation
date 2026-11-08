import { NextResponse } from "next/server";
import { getAdminActor, hasExportApprovalAccess } from "@/lib/auth/admin-access";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasExportApprovalAccess(actor.roles, actor.assuranceLevel)) return NextResponse.json({ error: "Only an AAL2 administrator can download exports." }, { status: 403 });
  const { id } = await context.params;
  const { data: exportRequest } = await actor.supabase.from("support_export_requests").select("status, expires_at").eq("id", id).maybeSingle();
  if (!exportRequest || exportRequest.status !== "approved" || !exportRequest.expires_at || new Date(exportRequest.expires_at) < new Date()) return NextResponse.json({ error: "This export is not approved or has expired." }, { status: 403 });
  const { data, error } = await actor.supabase.from("support_requests").select("id, county, beneficiary_group, need_category, urgency, status, created_at, assigned_to, follow_up_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const headers = ["id", "county", "beneficiary_group", "need_category", "urgency", "status", "created_at", "assigned_to", "follow_up_at"];
  const rows = (data ?? []).map((row) => headers.map((header) => csvCell((row as Record<string, unknown>)[header])).join(","));
  return new Response([headers.join(","), ...rows].join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="support-export-${id.slice(0, 8)}.csv"`, "cache-control": "no-store" } });
}
