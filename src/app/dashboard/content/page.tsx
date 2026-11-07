import { redirect } from "next/navigation";
import { ContentProgramForm } from "@/components/content-program-form";
import { ContentStoryForm } from "@/components/content-story-form";
import { getAdminActor, hasContentAccess } from "@/lib/auth/admin-access";

export const metadata = { title: "Content studio" };

export default async function ContentPage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/content");
  if (!hasContentAccess(actor.roles, actor.assuranceLevel)) return <section className="dashboard-page narrow-page"><p className="eyebrow">Content studio</p><h1>Verified editor access required.</h1><p className="lead muted">Content editing is limited to approved editors and administrators with a verified authenticator session.</p></section>;

  const [{ data: programs }, { data: stories }] = await Promise.all([
    actor.supabase.from("programs").select("id, slug, title, summary, description, counties, focus_groups, status, seo_title, seo_description, updated_at").order("updated_at", { ascending: false }),
    actor.supabase.from("stories").select("id, slug, title, excerpt, body, status, consent_recorded, seo_title, seo_description, updated_at").order("updated_at", { ascending: false }),
  ]);

  return <section className="dashboard-page narrow-page"><p className="eyebrow">Content studio</p><h1>Shape the public story.</h1><p className="lead muted">Create drafts, review consent, publish approved content, and keep a revision history for every editorial change.</p><div className="content-section"><div className="content-section-heading"><div><p className="eyebrow">Programs</p><h3>Program catalogue</h3></div><span className="form-note">{programs?.length ?? 0} records</span></div><details className="content-editor" open><summary>Create a new program</summary><ContentProgramForm /></details>{(programs ?? []).map((program) => <details className="content-editor" key={program.id}><summary><span>{program.title}</span><span className={`status-badge status-${program.status}`}>{program.status}</span></summary><ContentProgramForm program={program} /></details>)}</div><div className="content-section"><div className="content-section-heading"><div><p className="eyebrow">Stories</p><h3>Consent-led impact stories</h3></div><span className="form-note">{stories?.length ?? 0} records</span></div><details className="content-editor" open><summary>Create a new story</summary><ContentStoryForm /></details>{(stories ?? []).map((story) => <details className="content-editor" key={story.id}><summary><span>{story.title}</span><span className={`status-badge status-${story.status}`}>{story.status}</span></summary><ContentStoryForm story={story} /></details>)}</div></section>;
}
