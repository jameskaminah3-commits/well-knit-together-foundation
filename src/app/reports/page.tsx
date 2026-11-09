import Link from "next/link";
import { getPublishedReports } from "@/lib/reporting";

export const metadata = { title: "Reports and evidence" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await getPublishedReports();
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Reports and evidence</p><h1>Accountability you can read.</h1><p>Annual reports, financial documents, programme evidence, and other approved materials from the foundation.</p></div></section><section className="section"><div className="container"><div className="info-grid">{reports.length ? reports.map((report) => <article className="info-card" key={report.id}><p className="eyebrow">{report.report_category ?? "Report"}{report.report_year ? ` · ${report.report_year}` : ""}</p><h3>{report.title}</h3><p>{report.excerpt}</p>{report.evidence_label && <p className="form-note">{report.evidence_label}</p>}<Link className="card-link" href={`/resources/${report.slug}`}>Read report →</Link></article>) : <div className="empty-state"><h3>Reports will live here.</h3><p className="muted">The foundation has not published a report yet.</p></div>}</div></div></section></>;
}
