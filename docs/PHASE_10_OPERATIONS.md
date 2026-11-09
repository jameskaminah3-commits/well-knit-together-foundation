# Phase 10 — Deployment and continuous improvement

Phase 10 makes launch deliberate: the public experience stays calm and premium while the operating team has a visible way to monitor, learn, and recover.

## Implemented in this increment

- Railway deployment profile in `railway.json` using `npm run build`, `npm run start`, and `/api/health`.
- Public feedback journey at `/feedback`, with optional reply email and plain-language consent.
- Sitemap coverage for feedback and policy routes; dashboards and APIs remain excluded from the public index.
- CI workflow that blocks releases on high-severity dependency findings, lint errors, type errors, or a failed production build.
- Resend-ready transactional email delivery with signed provider webhooks and delivery visibility.
- Release documentation that separates development, staging, and production responsibilities.

## Environment separation

- Development: local `.env.local`, preview data, no real payment credentials.
- Staging: separate Supabase project, test payment provider, seeded non-sensitive records, protected by access control.
- Production: separate Supabase project, managed secrets, real payment and email webhooks, backups, monitoring, and named owner.

## Launch checklist

- [ ] Domain, DNS, TLS, email delivery, storage, and webhook endpoints verified.
- [ ] `/api/health` returns `200` from the deployed service and `503` when the database is unavailable.
- [ ] Rollback build and database restore path exercised in staging.
- [ ] Staff owner named for support, safeguarding, finance, content, and incident response.
- [ ] Feedback reviewed weekly during launch, then included in a quarterly roadmap review.
- [ ] Analytics, if enabled, measure useful outcomes without collecting sensitive case details.

## Release verification

Run the same gate locally and in CI before promoting a build:

```bash
npm run verify
```

This checks high-severity dependency advisories, lint, TypeScript, and the production build. A passing command validates the repository; it does not replace staging checks for Supabase RLS, payment callbacks, Resend delivery, backups, or restore procedures.
