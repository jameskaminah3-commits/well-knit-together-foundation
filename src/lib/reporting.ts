import { createClient } from "@/lib/supabase/server";

export interface PublicImpactMetric {
  id: string;
  metric_key: string;
  label: string;
  value: number;
  unit: string;
  period_label: string;
  county: string | null;
  beneficiary_group: string | null;
  public_note: string;
}

export async function getPublicImpactMetrics() {
  const supabase = await createClient();
  const { data } = await supabase.from("public_impact_metrics").select("id, metric_key, label, value, unit, period_label, county, beneficiary_group, public_note").eq("status", "approved").order("period_label", { ascending: false }).order("label");
  return (data ?? []) as PublicImpactMetric[];
}

export async function getPublishedReports() {
  const supabase = await createClient();
  const { data } = await supabase.from("content_items").select("id, slug, title, excerpt, body, file_path, report_year, report_category, evidence_label, published_at").eq("content_type", "report").eq("status", "published").eq("review_status", "approved").order("report_year", { ascending: false });
  return data ?? [];
}
