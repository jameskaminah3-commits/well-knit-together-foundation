"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Program = { id?: string; slug?: string; title?: string; summary?: string; description?: string | null; counties?: string[]; focus_groups?: string[]; status?: "draft" | "published" | "archived"; seo_title?: string | null; seo_description?: string | null };

export function ContentProgramForm({ program }: { program?: Program }) {
  const router = useRouter();
  const [form, setForm] = useState({ slug: program?.slug ?? "", title: program?.title ?? "", summary: program?.summary ?? "", description: program?.description ?? "", counties: program?.counties?.join(", ") ?? "", focus_groups: program?.focus_groups?.join(", ") ?? "", status: program?.status ?? "draft", seo_title: program?.seo_title ?? "", seo_description: program?.seo_description ?? "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    const payload = { ...form, id: program?.id, counties: form.counties.split(",").map((value) => value.trim()).filter(Boolean), focus_groups: form.focus_groups.split(",").map((value) => value.trim()).filter(Boolean) };
    const response = await fetch("/api/content/programs", { method: program?.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Could not save program.");
    else { setSaved(true); router.refresh(); }
    setBusy(false);
  }

  return <form className="content-form" onSubmit={submit}><div className="form-two-col"><label>Title<input value={form.title} onChange={(event) => update("title", event.target.value)} required /></label><label>Slug<input value={form.slug} onChange={(event) => update("slug", event.target.value)} required /></label></div><label>Summary<input value={form.summary} onChange={(event) => update("summary", event.target.value)} required /></label><label>Description<textarea rows={5} value={form.description} onChange={(event) => update("description", event.target.value)} required /></label><div className="form-two-col"><label>Counties, comma-separated<input value={form.counties} onChange={(event) => update("counties", event.target.value)} /></label><label>Focus groups, comma-separated<input value={form.focus_groups} onChange={(event) => update("focus_groups", event.target.value)} /></label></div><div className="form-two-col"><label>SEO title<input value={form.seo_title} onChange={(event) => update("seo_title", event.target.value)} /></label><label>SEO description<input value={form.seo_description} onChange={(event) => update("seo_description", event.target.value)} /></label></div><div className="content-form-footer"><label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><button className="button button-small" type="submit" disabled={busy}>{busy ? "Saving…" : program?.id ? "Save changes" : "Create draft"}</button>{error && <p className="form-alert form-alert-error" role="alert">{error}</p>}{saved && <p className="form-alert form-alert-success" role="status">Saved and revision recorded.</p>}</div></form>;
}
