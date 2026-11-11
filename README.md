# Well Knit Together Global Foundation

Production-oriented webapp foundation for the Well Knit Together Global Foundation.

The application is designed to serve women caregivers of children with disabilities, caregivers of other vulnerable groups, orphans and vulnerable children, people with disabilities, economically vulnerable women, donors, partners, volunteers, and the wider community.

## Stack

- Next.js App Router with TypeScript
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- Railway as the primary application host
- cPanel-compatible deployment kept possible for a static or supported Node deployment

## Local setup

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local`.
3. Fill in the Supabase project URL and publishable key.
4. Install dependencies with `npm install`.
5. Start the application with `npm run dev`.

The Supabase migration in `supabase/migrations/0001_initial_schema.sql` is the security boundary for the initial domain model. Apply it before connecting authenticated workflows.

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## Current foundation

- Public home, about, programs, impact, marketplace, and donate routes
- Supabase email/password, magic-link, registration, recovery, and logout flows
- Protected dashboard shell with account and TOTP security surfaces
- Database-backed public programs and impact stories with a protected content studio
- Authentication entry point and role-aware dashboard boundary
- Initial domain types and role model
- Initial Supabase schema with RLS policies
- Premium responsive visual system without a UI-kit lock-in
- Full implementation sequence in `docs/IMPLEMENTATION_PLAN.md`

For connected local development, see `docs/LOCAL_DEVELOPMENT.md`.

## Before launch

Read `docs/PRODUCTION_REVIEW.md`. In short:

- Set the public contact variables (`NEXT_PUBLIC_CONTACT_*`) and direct giving variables (`NEXT_PUBLIC_MPESA_*`, `NEXT_PUBLIC_BANK_*`) in Railway, then redeploy. They are read at build time.
- Set `PAYMENT_ENCRYPTION_KEY`, `PAYMENT_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY`. The super administrator then manages Paybill and bank details, M-Pesa Daraja credentials, and the online giving switch under **Payment settings** in the workspace.
- Apply every migration in `supabase/migrations` in order (0001–0019). Migrations 0016–0019 fix case notes, event registrations, the audit trail, shop stock, and staff saving programmes, stories, and application reviews.
- Sample content appears only in local development (`next dev`). Production shows only approved records from Supabase.
- Demo data and one account per role live in `supabase/seed.sql`, for local and staging use only. See `docs/LOCAL_DEVELOPMENT.md` and `docs/ROLES.md`.

This is the foundation layer. Payment providers, case-management workflows, inventory mutations, notifications, and production integrations are deliberately documented as later phases rather than being faked in the UI.
