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
- Turn on dependency and secret scanning in CI; never place a service-role key in browser code.
- Configure managed rate limiting, error monitoring, uptime checks, backups, and a tested restore drill.
- Run payment failure, duplicate payment, account recovery, export approval, and unauthorized access tests.
- Have the safeguarding lead and qualified Kenyan counsel review the public policies before launch.

## Evidence to retain

- Date, environment, commit, tester, and result for each release-readiness check.
- Restore drill log with recovery point and recovery time.
- RLS regression report and a record of any accepted risk.
