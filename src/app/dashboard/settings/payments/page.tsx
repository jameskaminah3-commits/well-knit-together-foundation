import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentSettingsPanel } from "@/components/payment-settings";
import { getAdminActor, hasSuperadminAccess } from "@/lib/auth/admin-access";
import { getGivingSettings, getPaymentReadiness, mpesaCallbackUrl } from "@/lib/payments/settings";

export const metadata = { title: "Payment settings" };
export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/settings/payments");
  if (!actor.roles.includes("superadmin")) return <section className="dashboard-page narrow-page"><p className="eyebrow">Payment settings</p><h1>Super administrator only.</h1><p className="lead muted">Payment settings decide where donors’ money goes, so only the super administrator can change them. Finance can see payment status on the finance workspace.</p><Link className="button button-secondary" href="/dashboard">Back to workspace</Link></section>;
  if (!hasSuperadminAccess(actor.roles, actor.assuranceLevel)) return <section className="dashboard-page narrow-page"><p className="eyebrow">Payment settings</p><h1>Verify with your authenticator first.</h1><p className="lead muted">Changing payment details requires two-step verification.</p><Link className="button" href="/dashboard/security">Open security settings</Link></section>;

  const [giving, readiness] = await Promise.all([getGivingSettings(), getPaymentReadiness()]);
  return (
    <section className="dashboard-page narrow-page">
      <div className="dashboard-heading"><div><p className="eyebrow">Super administrator</p><h1>Payment settings.</h1><p className="lead muted">Decide how supporters can give, and connect M-Pesa so gifts are confirmed and receipted automatically. Every change is recorded in the activity log.</p></div></div>
      <PaymentSettingsPanel
        enabled={giving.onlineCheckoutEnabled}
        checks={readiness.checks}
        giving={{ mpesaPaybill: giving.mpesaPaybill, mpesaAccountReference: giving.mpesaAccountReference, mpesaTill: giving.mpesaTill, bankName: giving.bankName, bankAccountName: giving.bankAccountName, bankAccountNumber: giving.bankAccountNumber, bankBranch: giving.bankBranch, bankSwift: giving.bankSwift, givingNote: giving.givingNote }}
        credentials={readiness.status}
        callbackUrl={mpesaCallbackUrl()}
      />
    </section>
  );
}
