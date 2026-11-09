import Link from "next/link";
import { getAdminActor, hasAdminAccess } from "@/lib/auth/admin-access";
import { emailDeliveryConfigured, emailWebhookConfigured } from "@/lib/email/service";

export const metadata = { title: "Communications" };

type EmailMessage = {
  id: string;
  message_type: string;
  recipient_email: string | null;
  subject: string;
  status: "queued" | "sent" | "failed" | "skipped";
  delivery_status: "accepted" | "delivered" | "bounced" | "complained" | "failed" | null;
  provider_message_id: string | null;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
};

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Not sent";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusClass(status: string) {
  return `communication-status communication-status-${status}`;
}

export default async function CommunicationsPage() {
  const actor = await getAdminActor();

  if (!actor.user || !hasAdminAccess(actor.roles, actor.assuranceLevel)) {
    return (
      <section className="dashboard-page narrow-page">
        <p className="eyebrow">Restricted workspace</p>
        <h1>Communications</h1>
        <p className="lead muted">This workspace is available to administrators after a verified MFA step-up.</p>
        <Link className="button button-secondary" href="/dashboard/security">Review security</Link>
      </section>
    );
  }

  const { data, error } = await actor.supabase
    .from("email_messages")
    .select("id,message_type,recipient_email,subject,status,delivery_status,provider_message_id,attempts,last_error,sent_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const messages = (data ?? []) as EmailMessage[];
  const counts = {
    sent: messages.filter((message) => message.status === "sent").length,
    delivered: messages.filter((message) => message.delivery_status === "delivered").length,
    failed: messages.filter((message) => message.status === "failed" || message.delivery_status === "failed").length,
    skipped: messages.filter((message) => message.status === "skipped").length,
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Operational visibility</p>
          <h1>Communications</h1>
          <p className="lead muted">A calm view of transactional email health, without exposing message contents or private case details.</p>
        </div>
        <Link className="button button-secondary" href="/dashboard">Back to overview</Link>
      </div>

      <div className="finance-metrics communication-metrics">
        <article className="info-card"><p className="eyebrow">Sent</p><h3>{counts.sent}</h3><small>Accepted by Resend</small></article>
        <article className="info-card"><p className="eyebrow">Delivered</p><h3>{counts.delivered}</h3><small>Confirmed by webhook</small></article>
        <article className="info-card"><p className="eyebrow">Needs attention</p><h3>{counts.failed + counts.skipped}</h3><small>Failed or intentionally skipped</small></article>
      </div>

      <div className="dashboard-notice communication-readiness">
        <div>
          <strong>Provider readiness</strong>
          <p>Resend delivery: {emailDeliveryConfigured() ? "configured" : "awaiting credentials"}. Webhook verification: {emailWebhookConfigured() ? "configured" : "awaiting signing secret"}.</p>
        </div>
        <span className={`status-badge ${emailDeliveryConfigured() && emailWebhookConfigured() ? "status-published" : "status-pending_review"}`}>
          {emailDeliveryConfigured() && emailWebhookConfigured() ? "Ready" : "Setup required"}
        </span>
      </div>

      <div className="section-heading compact-heading">
        <div><p className="eyebrow">Recent activity</p><h2>Delivery ledger</h2></div>
        <span className="muted">Showing the latest {messages.length} records</span>
      </div>

      {error ? (
        <div className="form-alert" role="alert">The delivery ledger could not be loaded. Check the migration and database connection before deploying.</div>
      ) : messages.length === 0 ? (
        <div className="empty-state"><h3>No messages yet</h3><p>Transactional email records will appear here after a feedback, support, engagement, giving, or marketplace workflow runs.</p></div>
      ) : (
        <div className="communications-list" aria-label="Recent email delivery records">
          {messages.map((message) => (
            <article className="communication-row" key={message.id}>
              <div className="communication-row-main">
                <div>
                  <p className="eyebrow">{labelize(message.message_type)}</p>
                  <h3>{message.subject}</h3>
                  <p className="muted communication-recipient">{message.recipient_email ?? "No recipient recorded"}</p>
                </div>
                <div className="communication-row-status">
                  <span className={statusClass(message.status)}>{labelize(message.status)}</span>
                  {message.delivery_status && <span className="muted">{labelize(message.delivery_status)}</span>}
                </div>
              </div>
              <div className="communication-row-meta">
                <span>{formatDate(message.sent_at ?? message.created_at)}</span>
                <span>{message.attempts} attempt{message.attempts === 1 ? "" : "s"}</span>
                {message.last_error && <span className="communication-error">{message.last_error}</span>}
                {message.provider_message_id && <span className="communication-id">{message.provider_message_id}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
