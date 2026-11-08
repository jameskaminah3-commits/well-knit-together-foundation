"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Asset = { id: string; bucket_id: string; storage_path: string; file_name: string; mime_type: string; file_size: number; alt_text: string; consent_recorded: boolean; status: string; created_at: string };

export function MediaLibrary() {
  const supabase = useMemo(() => createClient(), []);
  const [assets, setAssets] = useState<Asset[]>([]); const [altText, setAltText] = useState(""); const [consent, setConsent] = useState(false); const [file, setFile] = useState<File | null>(null); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function load() { const { data } = await supabase.from("media_assets").select("id, bucket_id, storage_path, file_name, mime_type, file_size, alt_text, consent_recorded, status, created_at").order("created_at", { ascending: false }); setAssets((data ?? []) as Asset[]); }
  useEffect(() => { let active = true; async function loadAssets() { const { data } = await supabase.from("media_assets").select("id, bucket_id, storage_path, file_name, mime_type, file_size, alt_text, consent_recorded, status, created_at").order("created_at", { ascending: false }); if (active) setAssets((data ?? []) as Asset[]); } void loadAssets(); return () => { active = false; }; }, [supabase]);
  function choose(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] ?? null); setMessage(""); setError(""); }
  async function upload() {
    if (!file || !altText.trim() || !consent) { setError("Choose a file, add accessible alt text, and confirm consent." ); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Files must be 5 MB or smaller."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Only JPEG, PNG, and WebP images are supported in the public library."); return; }
    setBusy(true); setError(""); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Your session has expired. Sign in again."); setBusy(false); return; }
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-"); const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const uploadResult = await supabase.storage.from("public-media").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadResult.error) { setError(uploadResult.error.message); setBusy(false); return; }
    const { error: metadataError } = await supabase.from("media_assets").insert({ bucket_id: "public-media", storage_path: path, file_name: file.name, mime_type: file.type, file_size: file.size, alt_text: altText.trim(), consent_recorded: consent, status: "draft", created_by: user.id });
    if (metadataError) { await supabase.storage.from("public-media").remove([path]); setError(metadataError.message); } else { setMessage("Uploaded to the private editorial queue. An administrator must approve it before publication."); setAltText(""); setConsent(false); setFile(null); await load(); }
    setBusy(false);
  }
  return <div className="media-library"><div className="media-upload"><p className="eyebrow">Public image library</p><h3>Upload consented media</h3><p className="muted">Images are stored in Supabase Storage and remain unpublished until approved. Keep people’s dignity and accessibility in mind.</p><label>Image file<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} /></label><label>Alt text<input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image for someone who cannot see it" /></label><label className="checkbox-label"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I confirm this image has the required consent for public use</label><button className="button button-small" type="button" onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Upload for review"}</button>{error && <p className="form-alert form-alert-error">{error}</p>}{message && <p className="form-alert form-alert-success">{message}</p>}</div><div className="media-list"><div className="content-section-heading"><h3>Recent assets</h3><span className="form-note">{assets.length} records</span></div>{assets.length ? assets.map((asset) => <div className="media-row" key={asset.id}><div><strong>{asset.file_name}</strong><span>{asset.mime_type} · {Math.round(asset.file_size / 1024)} KB</span></div><span className={`status-badge status-${asset.status}`}>{asset.status}</span></div>) : <div className="empty-state"><p className="muted">No media uploaded yet.</p></div>}</div></div>;
}
