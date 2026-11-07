# Local development

## Connected Supabase project

- Project: `well-knit-together-foundation`
- Project ref: `dqgpglhklidojslmrbhu`
- Region: Central EU (Frankfurt)
- Dashboard: https://supabase.com/dashboard/project/dqgpglhklidojslmrbhu

The initial schema and seed data are already applied. The database currently contains the 10 foundation tables and the three published starter programs.

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

Add future database changes as ordered files under `supabase/migrations/`. Apply them through the Supabase SQL Editor for now. When the Supabase CLI is introduced, link it to project ref `dqgpglhklidojslmrbhu` and use migration history rather than editing the live schema manually.
