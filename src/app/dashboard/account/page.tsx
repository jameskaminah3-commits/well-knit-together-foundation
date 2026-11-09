import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmailPreferencesForm } from "@/components/email-preferences-form";

const defaultPreferences = { event_updates: true, support_updates: true, giving_updates: true, marketplace_updates: true, impact_updates: true, marketing_opt_in: false };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "Not provided";
  const { data: savedPreferences } = user ? await supabase.from("email_preferences").select("event_updates, support_updates, giving_updates, marketplace_updates, impact_updates, marketing_opt_in").eq("user_id", user.id).maybeSingle() : { data: null };
  const preferences = { ...defaultPreferences, ...(savedPreferences ?? {}) };

  return (
    <section className="dashboard-page narrow-page">
      <p className="eyebrow">My account</p>
      <h1>Your account.</h1>
      <p className="lead muted">Keep your contact details and access information clear and current.</p>
      <div className="info-grid account-grid">
        <article className="info-card"><p className="eyebrow">Identity</p><h3>{displayName}</h3><p>{user?.email}</p><p className="form-note">Email verification and profile editing will be expanded in the next identity iteration.</p></article>
        <article className="info-card"><p className="eyebrow">Security</p><h3>Protect your access</h3><p>Set up an authenticator app for an additional layer of protection.</p><Link className="button button-small" href="/dashboard/security">Open security settings</Link></article>
      </div>
      <article className="info-card account-preferences"><p className="eyebrow">Email preferences</p><h2>Choose what belongs in your inbox.</h2><p className="muted">We keep messages useful, consent-aware, and easy to change.</p><EmailPreferencesForm initial={preferences} /></article>
    </section>
  );
}
