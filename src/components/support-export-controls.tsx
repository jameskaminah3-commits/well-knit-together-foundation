"use client";

type ExportRequest = { id: string; status: string; reason: string; created_at: string; requested_by: string; expires_at: string | null };

export function SupportExportControls({ initialRequests, canApprove }: { initialRequests: ExportRequest[]; canApprove: boolean }) {
  async function requestExport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget; const reason = String(new FormData(form).get("reason") || "");
    const response = await fetch("/api/support/exports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
    if (response.ok) window.location.reload();
  }
  async function approve(id: string) {
    const response = await fetch(`/api/support/exports/${id}/approve`, { method: "POST" });
    if (response.ok) window.location.reload();
  }
  return <div className="export-controls"><h3>Private exports</h3><p className="muted">Exports are intentionally minimal and require a separate administrator approval. Contact details and case narratives are never included.</p><form className="export-request-form" onSubmit={requestExport}><input name="reason" minLength={10} maxLength={500} required placeholder="Why is this export needed?" /><button className="button button-small" type="submit">Request export</button></form>{initialRequests.length > 0 && <div className="export-list">{initialRequests.map((item) => <div className="export-row" key={item.id}><div><strong>{item.status}</strong><span>{item.reason} · {new Date(item.created_at).toLocaleString()}</span></div>{item.status === "approved" ? <a className="text-link" href={`/api/support/exports/${item.id}`}>Download CSV</a> : canApprove && item.status === "pending" ? <button className="button button-small" type="button" onClick={() => approve(item.id)}>Approve</button> : null}</div>)}</div>}</div>;
}
