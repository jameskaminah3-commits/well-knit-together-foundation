import type { Metadata } from "next";
import Link from "next/link";
import { foundation } from "@/lib/site";
import { getPublishedReports } from "@/lib/reporting";

export const metadata: Metadata = { title: "Reports and accountability", description: `Annual reports, financial statements, and programme evidence from ${foundation.legalName}.`, alternates: { canonical: "/reports" } };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await getPublishedReports();
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Reports and accountability</p><h1>Accountability you can read.</h1><p>Annual reports, financial statements, and programme evidence, approved by our board. Our financial year runs {foundation.financialYear}.</p></div></section><section className="section"><div className="container"><h2 className="sr-only">Published reports</h2><div className="info-grid">{reports.length ? reports.map((report) => <article className="info-card" key={report.id}><p className="eyebrow">{report.report_category ?? "Report"}{report.report_year ? ` · ${report.report_year}` : ""}</p><h3>{report.title}</h3><p>{report.excerpt}</p>{report.evidence_label && <p className="form-note">{report.evidence_label}</p>}<Link className="card-link" href={`/reports/${report.slug}`}>Read report →</Link></article>) : <div className="empty-state"><h3>Our first annual report is being prepared.</h3><p className="muted">It will be published here after our financial year closes on 31 December and the board has approved it. Partners who need governance or financial documents sooner can <Link className="text-link" href="/contact">contact us</Link>.</p></div>}</div></div></section></>;
}
