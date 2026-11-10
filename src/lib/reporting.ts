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
  const { data } = await supabase.from("content_items").select("id, slug, title, excerpt, body, file_path, report_year, report_category, evidence_label, published_at, scheduled_for").eq("content_type", "report").eq("status", "published").eq("review_status", "approved").order("report_year", { ascending: false });
  return ((data ?? []) as PublicReport[]).filter((report) => !report.scheduled_for || new Date(report.scheduled_for).getTime() <= Date.now());
}

export interface PublicReport {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  file_path: string | null;
  report_year: number | null;
  report_category: string | null;
  evidence_label: string | null;
  published_at: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  scheduled_for?: string | null;
}

export async function getPublishedReport(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("content_items").select("id, slug, title, excerpt, body, file_path, report_year, report_category, evidence_label, published_at, seo_title, seo_description, scheduled_for").eq("slug", slug).eq("content_type", "report").eq("status", "published").eq("review_status", "approved").maybeSingle();
  if (!data) return null;
  if (data.scheduled_for && new Date(data.scheduled_for).getTime() > Date.now()) return null;
  return data as PublicReport;
}
