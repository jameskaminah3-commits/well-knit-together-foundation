"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContentReviewActions({ entityType, entityId }: { entityType: "program" | "story" | "content_item"; entityId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(decision: "approve" | "reject") {
    setBusy(true); setError("");
    const response = await fetch("/api/content/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entityType, entityId, decision }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Review action failed."); else router.refresh();
    setBusy(false);
  }
  return <div className="review-actions"><button className="button button-small" type="button" onClick={() => decide("approve")} disabled={busy}>Approve & publish</button><button className="button button-small button-secondary" type="button" onClick={() => decide("reject")} disabled={busy}>Return to draft</button>{error && <span className="form-alert form-alert-error">{error}</span>}</div>;
}
