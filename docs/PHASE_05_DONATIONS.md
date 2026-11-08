# Phase 5 — Donations and fundraising

## Implemented

- Active fundraising campaigns with public progress and campaign attribution.
- One-time and recurring donation intents without collecting raw card data.
- Donor giving history at `/dashboard/giving`.
- Finance dashboard at `/dashboard/finance`, gated by finance access and MFA assurance.
- Signed, idempotent payment webhook handling at `/api/donations/webhook`.
- Automatic donation receipts after a successful payment status update.
- Campaign raised-amount synchronization and payment-event records.
- Anonymous giving, receipt email, recurring intent, and update-consent fields.

## Database

Migration: `supabase/migrations/0006_phase5_fundraising.sql`

The migration creates fundraising campaigns, donor preferences, donation receipts, and payment events; extends donations for campaign and reconciliation metadata; adds RLS policies; and seeds the active campaign `care-capacity-opportunity-2026`.

## Local verification

Run:

```text
npm run lint
npm run build
npm run start -- -p 3005
```

Then open `/donate`. When the local server cannot reach Supabase, the page uses a clearly labelled local preview campaign so the premium UI remains reviewable without pretending that a donation was recorded.

## Production completion

Set `PAYMENT_WEBHOOK_SECRET` and the server-only `SUPABASE_SERVICE_ROLE_KEY` for the webhook runtime, then connect the selected M-Pesa/card provider. The final acceptance test must use a provider sandbox payment and verify provider reference, receipt number, reconciliation state, idempotent replay, and failure recovery.
