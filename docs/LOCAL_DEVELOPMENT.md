# Local development

## Connected Supabase project

- Project: `well-knit-together-foundation`
- Project ref: `dqgpglhklidojslmrbhu`
- Region: Central EU (Frankfurt)
- Dashboard: https://supabase.com/dashboard/project/dqgpglhklidojslmrbhu

Treat this project as development or staging. Production should be a separate Supabase project that never receives the demo seed.

## Run the webapp

The local-only `.env.local` file is configured in the workspace and is ignored by Git. If it is missing, copy `.env.example` to `.env.local` and add the project URL and publishable key from the Supabase dashboard.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For Phase 2 authentication testing, configure Supabase Authentication → URL Configuration with `http://localhost:3000` as the Site URL and `http://localhost:3000/auth/callback` as an allowed redirect URL. The working identity checklist is in `docs/PHASE_02_IMPLEMENTATION.md`.

## Environment safety

- Never commit `.env.local`.
- The publishable key may be used by the browser, but database access is still protected by RLS.
- Never put `SUPABASE_SERVICE_ROLE_KEY`, the database password, or payment credentials in client code or GitHub.
- Use separate Supabase projects for development, staging, and production before real beneficiary or payment data is introduced.

## Schema workflow

Add future database changes as ordered files under `supabase/migrations/`. Apply them through the Supabase SQL Editor for now. The Phase 7/8 completion migration is `0011_phase7_phase8_reporting.sql`; run it after the existing migrations, then run `supabase/seed.sql` so the indicator dictionary and programme-indicator assignments are available. When the Supabase CLI is introduced, link it to project ref `dqgpglhklidojslmrbhu` and use migration history rather than editing the live schema manually.

## Demo data

`supabase/seed.sql` fills a local or staging database with a realistic, entirely fictional year of activity across Mombasa, Kilifi, Kwale, Tana River, and Kajiado. It includes caregivers' support cases and referrals, partner and volunteer applications, events with attendance, an active school-fees appeal with M-Pesa gifts and receipts, three maker groups with a shop catalogue (original illustrations in `public/demo/products`), stories, news, resources, reports, and approved impact figures.

It also creates one account per role. Every account uses the password `WellKnit-Demo-2026!`.

| Email | Name | Role |
| --- | --- | --- |
| superadmin@demo.wellknit.test | Amani Mwakio | Super administrator |
| admin@demo.wellknit.test | Rehema Chari | Administrator |
| programs@demo.wellknit.test | Zawadi Kahindi | Program manager |
| finance@demo.wellknit.test | Baraka Mwinyi | Finance |
| shop@demo.wellknit.test | Saumu Bakari | Marketplace manager |
| editor@demo.wellknit.test | Neema Wairimu | Content editor |
| donor@demo.wellknit.test | Ruth Kamau | Donor (also a volunteer) |
| partner@demo.wellknit.test | Fatma Said | Partner, Pwani Inclusive Therapy Collective |
| volunteer@demo.wellknit.test | Brian Kiprono | Volunteer |
| caregiver@demo.wellknit.test | Mwanajuma Hamisi | Caregiver / beneficiary |

Staff tools stay locked until the account has two-step verification. Sign in, open **Security**, scan the QR code with any authenticator app, and enter the code.

### Loading it

With the Supabase CLI (Docker required), `supabase start` followed by `supabase db reset` applies every migration and then the seed. In `supabase/config.toml`, set `[auth.mfa.totp] enroll_enabled = true` and `verify_enabled = true` so staff can enrol an authenticator, and add `http://localhost:3000/**` to `additional_redirect_urls`. Point `.env.local` at the URL and keys that `supabase start` prints. For a hosted staging project, run each file in `supabase/migrations` in order, then `supabase/seed.sql`, in the SQL editor.

The seed refuses to run if the database already has any non-demo user. Before a staging project goes live, run `supabase/remove_demo_seed.sql` to remove every demo account and record. The three starter programmes are kept.

### Checking role access

After loading the seed, run the role regression tests:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/role_access.sql
```

Every line should start with `ok`. See `docs/ROLES.md` for what each role can do.

### Pictures

Demo pictures are original illustrations, not photographs: seven shop products in `public/demo/products` and covers for the three programmes, three stories, and three news items in `public/demo/covers`. Real photographs belong in the media library with recorded consent.
