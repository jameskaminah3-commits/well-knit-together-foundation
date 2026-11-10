import { redirect } from "next/navigation";
import { SupportCaseManager } from "@/components/support-case-manager";
import { SupportExportControls } from "@/components/support-export-controls";
import { SupportRequestForm } from "@/components/support-request-form";
import { getAdminActor, hasCaseAccess, hasExportApprovalAccess } from "@/lib/auth/admin-access";

export const metadata = { title: "Support cases" };
export const dynamic = "force-dynamic";

export default async function SupportDashboardPage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/support");
  if (!hasCaseAccess(actor.roles, actor.assuranceLevel)) return <section className="dashboard-page narrow-page"><p className="eyebrow">Support workspace</p><h1>Verified case access required.</h1><p className="lead muted">Support records are restricted to program managers and administrators with an authenticator session.</p></section>;

  const [{ data: requests }, { data: exports }] = await Promise.all([
    actor.supabase.from("support_requests").select("id, county, beneficiary_group, need_category, urgency, description, status, assigned_to, contact_name, contact_email, contact_phone, consent_to_contact, safeguarding_concern, safeguarding_flag, safeguarding_summary, follow_up_at, closure_reason, created_at").order("created_at", { ascending: false }),
    actor.supabase.from("support_export_requests").select("id, status, reason, created_at, requested_by, expires_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const requestRows = requests ?? [];
  const ids = requestRows.map((item) => item.id);
  const [{ data: notes }, { data: referrals }] = ids.length ? await Promise.all([
    actor.supabase.from("support_request_notes").select("id, support_request_id, note, created_at").in("support_request_id", ids).order("created_at", { ascending: false }),
    actor.supabase.from("support_referrals").select("id, support_request_id, partner_name, referral_status, response_due_at").in("support_request_id", ids).order("created_at", { ascending: false }),
  ]) : [{ data: [] }, { data: [] }];
  const records = requestRows.map((item) => ({ ...item, notes: (notes ?? []).filter((note) => note.support_request_id === item.id), referrals: (referrals ?? []).filter((referral) => referral.support_request_id === item.id) }));

  return <section className="dashboard-page"><div className="dashboard-heading"><div><p className="eyebrow">Support services</p><h1>Support cases.</h1><p className="lead muted">Receive, triage, refer, follow up, and close requests inside a private, auditable workspace.</p></div></div><div className="dashboard-notice"><div><strong>Privacy boundary active.</strong><p>Public visitors can submit a request, but cannot read case records. Safeguarding flags and internal notes stay inside this workspace.</p></div></div><div className="support-dashboard-grid"><div><div className="content-section-heading"><div><p className="eyebrow">Assisted submission</p><h3>Create a case with someone present</h3></div></div><div className="support-form-card"><p className="muted">Use this when a person cannot complete the public form. Record only the minimum needed and confirm contact consent.</p><SupportRequestForm assisted /></div><div className="content-section-heading support-list-heading"><div><p className="eyebrow">Case queue</p><h3>{records.length} request{records.length === 1 ? "" : "s"}</h3></div></div><SupportCaseManager initialCases={records as never} /></div><SupportExportControls initialRequests={(exports ?? []) as never} canApprove={hasExportApprovalAccess(actor.roles, actor.assuranceLevel)} /></div></section>;
}
