# Phase 11 — Resend email delivery

The foundation now has a Resend-ready transactional email layer. It keeps sensitive support and safeguarding details out of email, deduplicates messages, records delivery attempts, and accepts signed Resend delivery webhooks.

## Implemented

- Shared server-only Resend delivery service using `RESEND_API_KEY` and `EMAIL_FROM`.
- Branded HTML and plain-text templates for feedback, support, engagement, events, giving, and marketplace workflows.
- Deduplication keys so retries do not send duplicate messages.
- `email_messages` delivery ledger with accepted, delivered, bounced, complained, failed, and skipped states.
- `email_preferences` foundation for user-controlled optional communications.
- Signed Resend webhook route at `/api/email/webhook`.
- MFA-gated administrator communications workspace at `/dashboard/communications` with delivery readiness and ledger visibility.
- Health output reports whether email delivery is configured; `REQUIRE_EMAIL_DELIVERY=true` can make missing email configuration a deployment failure.

## Supabase Auth

Account verification, password recovery, magic links, and staff invitations remain Supabase Auth flows. Configure Supabase custom SMTP with the Resend SMTP credentials so those messages use the same verified sending domain and brand.

## Required production configuration

```text
RESEND_API_KEY=
EMAIL_FROM=Well Knit Together <hello@example.org>
EMAIL_REPLY_TO=
RESEND_WEBHOOK_SECRET=
REQUIRE_EMAIL_DELIVERY=true
```

Register the webhook URL as `/api/email/webhook` for delivered, bounced, complained, and failed events. Do not put the API key in a `NEXT_PUBLIC_*` variable or commit it.
