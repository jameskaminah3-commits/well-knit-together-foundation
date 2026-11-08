import { redirect } from "next/navigation";
import { ContentItemForm } from "@/components/content-item-form";
import { ContentLocalizationForm } from "@/components/content-localization-form";
import { ContentProgramForm } from "@/components/content-program-form";
import { ContentReviewActions } from "@/components/content-review-actions";
import { ContentStoryForm } from "@/components/content-story-form";
import { getAdminActor, hasAdminAccess, hasContentAccess } from "@/lib/auth/admin-access";

export const metadata = { title: "Content studio" };

export default async function ContentPage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/content");
  if (!hasContentAccess(actor.roles, actor.assuranceLevel)) return <section className="dashboard-page narrow-page"><p className="eyebrow">Content studio</p><h1>Verified editor access required.</h1><p className="lead muted">Content editing is limited to approved editors and administrators with a verified authenticator session.</p></section>;
  const canReview = hasAdminAccess(actor.roles, actor.assuranceLevel);
  const [{ data: programs }, { data: stories }, { data: items }] = await Promise.all([
    actor.supabase.from("programs").select("id, slug, title, summary, description, counties, focus_groups, status, scheduled_for, seo_title, seo_description, review_status, updated_at").order("updated_at", { ascending: false }),
    actor.supabase.from("stories").select("id, slug, title, excerpt, body, status, scheduled_for, consent_recorded, seo_title, seo_description, review_status, updated_at").order("updated_at", { ascending: false }),
    actor.supabase.from("content_items").select("id, content_type, slug, title, excerpt, body, status, location, starts_at, ends_at, scheduled_for, file_path, seo_title, seo_description, review_status, updated_at").order("updated_at", { ascending: false }),
  ]);
  const review = (entityType: "program" | "story" | "content_item", record: { id: string; review_status?: string | null }) => canReview && record.review_status === "pending_review" ? <ContentReviewActions entityType={entityType} entityId={record.id} /> : null;
  return <section className="dashboard-page narrow-page"><div className="dashboard-heading"><div><p className="eyebrow">Content studio</p><h1>Shape the public story.</h1><p className="lead muted">Draft, translate, schedule, review, and publish content with consent and revision history built into the workflow.</p></div><a className="button button-small" href="/dashboard/content/media">Media library</a></div><div className="dashboard-notice"><div><strong>Editorial gate</strong><p>Editors submit content for review. AAL2 administrators approve publication.</p></div><span className="role-chip">{canReview ? "Reviewer access" : "Editor access"}</span></div>
    <div className="content-section"><div className="content-section-heading"><div><p className="eyebrow">Programs</p><h3>Program catalogue</h3></div><span className="form-note">{programs?.length ?? 0} records</span></div><details className="content-editor" open><summary>Create a new program</summary><ContentProgramForm /></details>{(programs ?? []).map((program) => <details className="content-editor" key={program.id}><summary><span>{program.title}</span><span className={`status-badge status-${program.review_status === "pending_review" ? "pending_review" : program.status}`}>{program.review_status === "pending_review" ? "pending review" : program.status}</span></summary><ContentProgramForm program={program} />{review("program", program)}<ContentLocalizationForm entityType="program" entityId={program.id} /></details>)}</div>
    <div className="content-section"><div className="content-section-heading"><div><p className="eyebrow">Stories</p><h3>Consent-led impact stories</h3></div><span className="form-note">{stories?.length ?? 0} records</span></div><details className="content-editor" open><summary>Create a new story</summary><ContentStoryForm /></details>{(stories ?? []).map((story) => <details className="content-editor" key={story.id}><summary><span>{story.title}</span><span className={`status-badge status-${story.review_status === "pending_review" ? "pending_review" : story.status}`}>{story.review_status === "pending_review" ? "pending review" : story.status}</span></summary><ContentStoryForm story={story} />{review("story", story)}<ContentLocalizationForm entityType="story" entityId={story.id} /></details>)}</div>
    <div className="content-section"><div className="content-section-heading"><div><p className="eyebrow">News, events & resources</p><h3>One editorial calendar</h3></div><span className="form-note">{items?.length ?? 0} records</span></div><details className="content-editor" open><summary>Create news, event, report, or resource</summary><ContentItemForm /></details>{(items ?? []).map((item) => <details className="content-editor" key={item.id}><summary><span>{item.title} <small className="muted">· {item.content_type}</small></span><span className={`status-badge status-${item.review_status === "pending_review" ? "pending_review" : item.status}`}>{item.review_status === "pending_review" ? "pending review" : item.status}</span></summary><ContentItemForm item={item} />{review("content_item", item)}<ContentLocalizationForm entityType="content_item" entityId={item.id} /></details>)}</div>
  </section>;
}
