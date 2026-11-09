import { redirect } from "next/navigation";
import { ReportingWorkspace } from "@/components/reporting-workspace";
import { getAdminActor, hasReportingAccess } from "@/lib/auth/admin-access";

export const metadata = { title: "Reporting and measurement" };
export const dynamic = "force-dynamic";

export default async function ReportingPage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/reporting");
  if (!hasReportingAccess(actor.roles, actor.assuranceLevel)) return <section className="dashboard-page narrow-page"><p className="eyebrow">Reporting and measurement</p><h1>Verified reporting access required.</h1><p className="lead muted">Outcome records and data-quality queues are restricted to programme, finance, and administrator roles with an authenticator session.</p></section>;
  const [{ data: programIndicators }, { data: observations }, { data: metrics }] = await Promise.all([
    actor.supabase.from("program_indicators").select("id, target, target_period, indicator_id, program_id, indicator_dictionary(name, code, unit), programs(title)").eq("active", true).order("created_at"),
    actor.supabase.from("indicator_observations").select("id, value, validation_status, county, beneficiary_group, reporting_period_end, source, program_indicator_id").order("created_at", { ascending: false }).limit(40),
    actor.supabase.from("public_impact_metrics").select("id, label, value, unit, period_label, status, public_note").order("created_at", { ascending: false }).limit(40),
  ]);
  const normalizedProgramIndicators = (programIndicators ?? []).map((item) => ({ ...item, indicator: Array.isArray(item.indicator_dictionary) ? item.indicator_dictionary[0] : item.indicator_dictionary, program: Array.isArray(item.programs) ? item.programs[0] : item.programs }));
  return <section className="dashboard-page"><div className="dashboard-heading"><div><p className="eyebrow">Phase 8 · reporting and measurement</p><h1>Make progress useful.</h1><p className="lead muted">Use the indicator dictionary, capture validated observations, review data-quality flags, and approve only privacy-safe aggregates for the public impact page.</p></div></div><div className="dashboard-notice"><div><strong>Privacy boundary active.</strong><p>Raw observations remain staff-only. Public metrics are separate records and require explicit approval before publication.</p></div></div><ReportingWorkspace programIndicators={normalizedProgramIndicators} observations={observations ?? []} metrics={metrics ?? []} /></section>;
}
