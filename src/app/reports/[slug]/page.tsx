import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicFileUrl } from "@/lib/content";
import { getPublishedReport } from "@/lib/reporting";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const report = await getPublishedReport(slug);
  return { title: report?.seo_title ?? report?.title ?? "Report", description: report?.seo_description ?? report?.excerpt, alternates: { canonical: `/reports/${slug}` } };
}

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = await getPublishedReport(slug);
  if (!report) notFound();
  const downloadUrl = publicFileUrl(report.file_path);
  return (
    <article className="section">
      <div className="container story-body">
        <Link className="text-link" href="/reports">← All reports</Link>
        <p className="eyebrow" style={{ marginTop: 24 }}>{report.report_category ?? "Report"}{report.report_year ? ` · ${report.report_year}` : ""}</p>
        <h1>{report.title}</h1>
        <p className="lead muted">{report.excerpt}</p>
        {report.evidence_label && <p className="form-note">{report.evidence_label}</p>}
        <div className="story-body">{report.body.split("\n").filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        {downloadUrl && <p><a className="button" href={downloadUrl} rel="noopener noreferrer">Download the full report</a></p>}
      </div>
    </article>
  );
}
