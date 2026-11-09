# Phase 9 — Security, reliability, and production readiness

Phase 9 turns the foundation from a feature-complete webapp into a service that can be trusted with real people, money, and operational decisions.

## Implemented in this increment

- Secure response headers: frame protection, MIME sniffing protection, referrer policy, permissions policy, cross-origin isolation, and a restrictive content security policy.
- `/api/health` readiness endpoint checks configuration and database reachability without exposing secrets or query details.
- In-memory abuse throttling and bounded input validation for public submissions and authentication; production deployment should add a shared store or edge rate limiter.
- GitHub Actions CI runs dependency auditing, linting, TypeScript validation, and the production build on pushes and pull requests.
- Global error and not-found states that preserve dignity, explain what happened, and offer a clear next action.
- Plain-language privacy, terms, safeguarding, giving/refund, and marketplace terms pages.
- New `site_feedback` table with RLS, explicit grants, consent-gated public inserts, and staff-only review/update access.

## Before production acceptance

- Run an independent RLS matrix against anonymous, beneficiary, partner, volunteer, staff, and AAL2 admin sessions.
- Run `npm run security:smoke` against staging with the publishable Supabase environment to verify public reads remain public while sensitive tables return no anonymous data. This is an anonymous smoke check, not a replacement for the full role matrix.
- Configure staging-only `RLS_TEST_USERS_JSON` and run `npm run security:roles` to sign in dedicated test accounts, verify their role memberships and own-profile boundary, and confirm non-privileged accounts cannot read audit, email, or internal support-note data. Keep these passwords only in the staging secret manager.
- Turn on dependency and secret scanning in CI; never place a service-role key in browser code.
- Configure managed rate limiting, error monitoring, uptime checks, backups, and a tested restore drill.
- Run payment failure, duplicate payment, account recovery, export approval, and unauthorized access tests.
- Have the safeguarding lead and qualified Kenyan counsel review the public policies before launch.

## Evidence to retain

- Date, environment, commit, tester, and result for each release-readiness check.
- Restore drill log with recovery point and recovery time.
- RLS regression report and a record of any accepted risk.
