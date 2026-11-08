import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My support requests" };
export const dynamic = "force-dynamic";

export default async function MySupportRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/support/requests");
  const { data: requests } = await supabase.from("support_requests").select("id, subject, county, need_category, urgency, status, created_at, follow_up_at").eq("requester_id", user.id).order("created_at", { ascending: false });
  return <section className="section"><div className="container narrow-page"><p className="eyebrow">Your support</p><h1>My requests.</h1><p className="lead muted">This view shows only your own request status. Staff notes, safeguarding information, and referral contacts remain private.</p><div className="my-request-list">{requests?.length ? requests.map((request) => <article className="info-card" key={request.id}><div className="request-row-heading"><div><p className="eyebrow">Reference {request.id.slice(0, 8).toUpperCase()}</p><h3>{request.subject}</h3></div><span className={`status-badge status-${request.status}`}>{request.status.replaceAll("_", " ")}</span></div><p className="muted">{request.county} · {request.need_category.replaceAll("_", " ")} · submitted {new Date(request.created_at).toLocaleDateString()}</p>{request.follow_up_at && <p className="form-note">Next follow-up: {new Date(request.follow_up_at).toLocaleDateString()}</p>}</article>) : <div className="empty-state"><h3>No account-linked requests yet.</h3><p className="muted">A request you submit while signed in will appear here.</p></div>}<Link className="button button-secondary" href="/support">Request support</Link></div></div></section>;
}
