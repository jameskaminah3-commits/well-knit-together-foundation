import type { Metadata } from "next";
import Link from "next/link";
import { Helplines } from "@/components/helplines";
import { SupportRequestForm } from "@/components/support-request-form";
import { contactChannels, foundation, telHref } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Request support · Omba msaada",
  description: `Caregivers of children with disabilities and vulnerable families in ${foundation.counties.join(", ")} can request support privately. No account needed. Unaweza kuandika kwa Kiswahili.`,
  alternates: { canonical: "/support" },
};

export default async function SupportPage() {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    userEmail = null;
  }

  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Request support · Omba msaada</p><h1>A safe first step toward support.</h1><p>Tell us what kind of help you or your family needs. A trained team member will review your request privately and contact you about the best next step.</p><p lang="sw">Tuambie unahitaji msaada gani. Ombi lako ni la siri na litaangaliwa na mfanyakazi wetu aliyefunzwa.</p></div></section>
      <section className="section">
        <div className="container split support-layout">
          <div>
            <p className="eyebrow">Before you begin</p>
            <h2>Share only what is necessary.</h2>
            <ul className="support-steps">
              <li><strong>1. Tell us what is happening.</strong> A few sentences are enough, in English or Kiswahili.</li>
              <li><strong>2. Choose how we can reach you.</strong> Phone, SMS, WhatsApp, or email—or stay anonymous.</li>
              <li><strong>3. Keep your reference number.</strong> Use it whenever you speak to us about this request.</li>
            </ul>
            <p className="muted">You do not need an account. {userEmail ? <>This request will be linked to {userEmail}. <Link className="card-link" href="/support/requests">View my requests →</Link></> : "If you would like to track your request online, you can sign in first."}</p>
            {(contactChannels.phone || contactChannels.whatsapp) && <div className="notice-card"><strong>Prefer to talk?</strong><p>{contactChannels.phone && <>Call <a href={telHref(contactChannels.phone)}>{contactChannels.phone}</a></>}{contactChannels.phone && contactChannels.whatsapp && " or "}{contactChannels.whatsapp && <a href={`https://wa.me/${contactChannels.whatsapp}`} rel="noopener noreferrer" target="_blank">message us on WhatsApp</a>}. A team member can fill in this form with you.</p></div>}
            <div className="info-card support-safety-note">
              <Helplines title="Not an emergency service · Kwa dharura piga" />
            </div>
          </div>
          <div className="support-form-card"><h3>Request support</h3><p className="muted">Your request is confidential. Only authorised case staff can see it.</p><SupportRequestForm /></div>
        </div>
      </section>
    </>
  );
}
