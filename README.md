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

## Current skeleton

- Public home, about, programs, impact, marketplace, and donate routes
- Authentication entry point and dashboard boundary
- Initial domain types and role model
- Initial Supabase schema with RLS policies
- Premium responsive visual system without a UI-kit lock-in
- Full implementation sequence in `docs/IMPLEMENTATION_PLAN.md`

This is the foundation layer. Payment providers, case-management workflows, inventory mutations, notifications, and production integrations are deliberately documented as later phases rather than being faked in the UI.
