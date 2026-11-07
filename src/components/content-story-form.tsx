"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Story = { id?: string; slug?: string; title?: string; excerpt?: string; body?: string; status?: "draft" | "published" | "archived"; consent_recorded?: boolean; seo_title?: string | null; seo_description?: string | null };

export function ContentStoryForm({ story }: { story?: Story }) {
  const router = useRouter();
  const [form, setForm] = useState({ slug: story?.slug ?? "", title: story?.title ?? "", excerpt: story?.excerpt ?? "", body: story?.body ?? "", status: story?.status ?? "draft", consent_recorded: story?.consent_recorded ?? false, seo_title: story?.seo_title ?? "", seo_description: story?.seo_description ?? "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    const response = await fetch("/api/content/stories", { method: story?.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, id: story?.id }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Could not save story.");
    else { setSaved(true); router.refresh(); }
    setBusy(false);
  }

  return <form className="content-form" onSubmit={submit}><div className="form-two-col"><label>Title<input value={form.title} onChange={(event) => update("title", event.target.value)} required /></label><label>Slug<input value={form.slug} onChange={(event) => update("slug", event.target.value)} required /></label></div><label>Excerpt<input value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} required /></label><label>Story body<textarea rows={9} value={form.body} onChange={(event) => update("body", event.target.value)} required /></label><div className="form-two-col"><label>SEO title<input value={form.seo_title} onChange={(event) => update("seo_title", event.target.value)} /></label><label>SEO description<input value={form.seo_description} onChange={(event) => update("seo_description", event.target.value)} /></label></div><label className="checkbox-label"><input type="checkbox" checked={form.consent_recorded} onChange={(event) => update("consent_recorded", event.target.checked)} /> Consent has been recorded and can be verified</label><div className="content-form-footer"><label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><button className="button button-small" type="submit" disabled={busy}>{busy ? "Saving…" : story?.id ? "Save changes" : "Create draft"}</button>{error && <p className="form-alert form-alert-error" role="alert">{error}</p>}{saved && <p className="form-alert form-alert-success" role="status">Saved and revision recorded.</p>}</div></form>;
}
