import Link from "next/link";
import { SupportRequestForm } from "@/components/support-request-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Request support" };

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Support and referrals</p><h1>A safe first step toward support.</h1><p>Tell us what kind of help is needed. A trained team member will review the request privately and connect you with the most appropriate next step.</p></div></section><section className="section"><div className="container split"><div><p className="eyebrow">Before you begin</p><h2>Share only what is necessary.</h2><p className="lead muted">You do not need an account to submit a request. If you are signed in, we can associate it with your account so you can see its status later.</p>{user ? <><p className="form-note">This submission will be associated with {user.email}.</p><Link className="card-link" href="/support/requests">View my requests →</Link></> : <p className="form-note">For an anonymous request, leave the contact section blank. We will not be able to follow up without a consented contact method.</p>}<div className="info-card support-safety-note"><strong>Not an emergency service</strong><p>If someone is in immediate danger, contact local emergency services or a trusted person now.</p><Link className="card-link" href="/about#contact">Find other ways to contact us →</Link></div></div><div className="support-form-card"><h3>Request support</h3><p className="muted">Required fields are marked by the form. Your request is confidential and is visible only to authorised case staff.</p><SupportRequestForm /></div></div></section></>;
}
