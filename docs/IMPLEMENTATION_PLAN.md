# Well Knit Together implementation plan

## Product north star

Build a trusted, premium, mobile-first digital home for the foundation: a public platform for understanding the mission and participating in it, plus a secure operational system for programs, people, money, products, and evidence.

The product must serve the following groups without reducing people to labels: women caregivers of children with disabilities; caregivers of vulnerable children, elderly people, and people with disabilities; orphans and vulnerable children; people with disabilities; economically vulnerable women; donors; partners; volunteers; and the wider community.

## Foundation already created

The initial codebase establishes:

- Next.js App Router and TypeScript application shell.
- Premium responsive visual direction with accessible semantic navigation.
- Public route surface for home, about, programs, impact, marketplace, and giving.
- Authentication and dashboard boundaries ready for Supabase Auth.
- Role vocabulary for superadmin, administrators, program, finance, marketplace, content, donor, partner, volunteer, and beneficiary access.
- Supabase tables for profiles, roles, programs, support requests, stories, products, donations, orders, order items, and audit logs.
- Row Level Security as the default data protection layer.
- A health endpoint for deployment checks.
- Environment variable contract and a Railway/cPanel-aware deployment posture.

Phase 1 working artifacts are now captured in:

- `docs/PHASE_01_PRODUCT_BRIEF.md`
- `docs/CONTENT_MATRIX.md`
- `docs/ROLE_AND_PERMISSION_MATRIX.md`
- `docs/SAFEGUARDING_AND_PRIVACY_BASELINE.md`
- `docs/DESIGN_SYSTEM.md`

Phase 2 implementation artifacts are now captured in:

- `docs/PHASE_02_IMPLEMENTATION.md`

Phase 3 implementation artifacts are now captured in:

- `docs/PHASE_03_CONTENT_CMS.md`

## Delivery phases

### Phase 1 — Discovery, content, and design system

Goal: turn the foundation’s mandate into an approved product specification and visual system.

Deliverables:

- Confirm brand identity, logo, colour palette, photography, typography, and tone.
- Approve information architecture and navigation.
- Write the first public content set for every population and program area.
- Define English and Swahili content workflow.
- Define accessibility baseline: WCAG 2.2 AA target, keyboard navigation, contrast, captions, alt text, readable language, and low-bandwidth behaviour.
- Define consent, safeguarding, privacy, and beneficiary-story rules.
- Produce wireframes and final designs for public pages, mobile views, staff portal, support request, donation, and marketplace journeys.

Acceptance: signed-off sitemap, content matrix, role matrix, design tokens, and privacy/safeguarding rules.

### Phase 2 — Identity, roles, and secure application shell

Goal: replace the preview login with production authentication.

Deliverables:

- Supabase Auth email/password and magic link flows.
- Password reset, email verification, session refresh, logout, and account settings.
- MFA requirement for superadmin and privileged staff.
- Invite-only staff onboarding with role assignment.
- Beneficiary, donor, partner, volunteer, and staff profile boundaries.
- Server-side authorization checks in addition to database RLS.
- Audit events for sign-in, role changes, sensitive reads, exports, and administrative mutations.

Acceptance: each role sees only its approved portal and data; privilege escalation tests fail safely.

Current status: the first implementation slice is complete for authentication, protected routing, role visibility, account recovery, and TOTP enrollment. Invite-only staff onboarding, enforced privileged MFA, role administration, and audit events remain before Phase 2 can be accepted.

### Phase 3 — Public content and CMS workflows

Goal: make the public site editable by authorised staff.

Deliverables:

- Program pages connected to Supabase.
- Stories, news, events, resources, and reports.
- Media library with image optimisation and private/public storage separation.
- Editorial drafts, review, publish, archive, and scheduled publication.
- Consent metadata on beneficiary stories and media.
- Search engine metadata, sitemap, robots rules, and social sharing cards.

Acceptance: a content editor can publish approved content without database access or developer help.

Current status: implementation complete. Public programs and impact stories are database-backed, consent-aware, SEO-ready, and editable through a protected content studio. Media storage, review queues, scheduling, additional content types, localisation, sitemap, robots, and Open Graph support are implemented. Before production acceptance, apply the Phase 3 migrations and run the workflow checklist in `docs/PHASE_03_CONTENT_CMS.md` against the connected Supabase project.

### Phase 4 — Support, referrals, and beneficiary services

Goal: provide safe, dignified ways for people to request support.

Deliverables:

- Public support request and referral intake.
- Optional account-based and assisted-submission workflows.
- County, population, need, urgency, and preferred-contact capture.
- Case status, assignment, notes, referral partners, follow-up dates, and closure reasons.
- Consent, safeguarding flags, data minimisation, and retention controls.
- Staff dashboards and private exports with approval gates.
- SMS, email, and WhatsApp integration only after consent and provider review.

Acceptance: a request can be received, triaged, referred, followed up, resolved, and audited without exposing sensitive records publicly.

Current status: implementation slice complete. Public and assisted intake, private case management, referrals, safeguarding fields, retention metadata, redaction support, event auditing, and approval-gated minimal exports are implemented. Apply `supabase/migrations/0005_phase4_support_services.sql` and complete `docs/PHASE_04_SUPPORT_SERVICES.md` before production acceptance.

### Phase 5 — Donations and fundraising

Goal: create a reliable, transparent funding journey.

Deliverables:

- One-time and recurring campaigns.
- M-Pesa and card payment provider integration.
- Hosted/redirected payment pages where possible; never store raw card data.
- Signed webhook handling, idempotency, payment status reconciliation, and failure recovery.
- Donor accounts, receipts, anonymous giving, consent preferences, and campaign attribution.
- Finance dashboard, refunds, exports, reconciliation, and audit trails.
- Public campaign progress and approved impact allocation messaging.

Acceptance: every successful payment has a verifiable provider reference, receipt path, reconciliation state, and audit trail.

Current status: the fundraising data model, active campaign, donor giving history, finance dashboard, donation-intent API, signed/idempotent webhook path, receipt trigger, and campaign progress UI are implemented. Apply `supabase/migrations/0006_phase5_fundraising.sql` (already applied to the connected project) and configure the payment provider secret plus service-role webhook runtime before production acceptance.

### Phase 6 — Marketplace and economic empowerment

Goal: help supported makers present and sell products sustainably.

Deliverables:

- Product catalogue, categories, maker stories, images, stock, pricing, and availability.
- Maker onboarding and approval flow.
- Cart, checkout, customer account, delivery details, and order status.
- Payment integration shared safely with the donations layer.
- Inventory reservations, fulfilment workflow, returns, cancellations, and customer support.
- Sales and maker-impact reports.
- Privacy-safe storytelling that avoids exploitative imagery or claims.

Acceptance: an approved product can be discovered, purchased, fulfilled, reconciled, and included in impact reporting.

Current status: the public marketplace catalogue, privacy-safe maker stories, seeded sample products, stock-aware bag, authenticated order-intent API, inventory reservations, product detail pages, and customer order dashboard are implemented. Apply `supabase/migrations/0007_phase6_marketplace.sql` (already applied to the connected project) and connect the shared payment provider plus fulfilment operations before production acceptance.

### Phase 7 — Partners, volunteers, training, and community engagement

Goal: turn the website into a participation and capacity-building platform.

Deliverables:

- Partner application and due-diligence records.
- Volunteer application, skills, availability, consent, and assignment.
- Events and training catalogue with registration and attendance.
- Resource library with downloadable guides.
- Notifications and segmented communications.
- Partner workspace with only the programs and referrals assigned to them.

Acceptance: partners and volunteers can apply, be approved, participate, and receive only appropriate information.

Current status: Phase 7 is implemented through the public engagement landing, partner and volunteer application forms, seeded learning events with registration, staff review/due-diligence/assignment/attendance workflows, segmented in-app notifications, a least-privilege partner workspace, and RLS-backed engagement migrations. The marketplace also carries clearly labelled sample reference imagery and a refreshed ink-teal, terracotta, and warm-paper palette. Replace sample imagery with rights-cleared maker uploads before launch.

### Phase 8 — Reporting, transparency, and measurement

Goal: show credible progress without compromising private data.

Deliverables:

- Indicator dictionary and program outcome model.
- Data collection forms and validation rules.
- County/program/population dashboards.
- Public impact page with aggregated, approved metrics.
- Annual reports, financial documents, and downloadable evidence.
- Data-quality checks and change history.

Acceptance: internal dashboards support decisions and public reports contain no re-identifiable beneficiary information.

Current status: Phase 8 is implemented through the indicator dictionary, programme outcome model, validated observation intake, data-quality checks and history, county/programme/population dimensions, staff reporting workspace, approved public aggregates, and report/evidence publishing surfaces. Apply `supabase/migrations/0011_phase7_phase8_reporting.sql`, run the seed, and complete the operating checklist in `docs/PHASE_08_REPORTING.md` before production acceptance.

### Phase 9 — Security, reliability, and production readiness

Goal: harden the system for real users and real money.

Deliverables:

- Threat model and data classification.
- RLS test suite and authorization regression tests.
- Dependency scanning, secret scanning, secure headers, CSP, rate limiting, and abuse monitoring.
- Backups, restore drills, error monitoring, uptime checks, and incident runbook.
- Privacy policy, terms, cookie consent where required, safeguarding policy, refund policy, and marketplace terms.
- Performance testing for low-bandwidth mobile connections.
- Disaster recovery and account recovery procedures.

Acceptance: a production-readiness review passes, including restore, payment failure, unauthorized access, and data export tests.

### Phase 10 — Deployment and continuous improvement

Goal: launch safely and operate deliberately.

Deliverables:

- Separate development, staging, and production Supabase projects.
- Railway deployment with environment secrets and health checks.
- Optional cPanel deployment profile for the frontend or supported server runtime.
- Domain, DNS, TLS, email delivery, storage, and webhook configuration.
- Analytics focused on useful outcomes rather than invasive tracking.
- Feedback loop with caregivers, staff, makers, donors, and partners.
- Release checklist, changelog, support ownership, and quarterly roadmap review.

Acceptance: staged release, monitored launch, rollback path, and named owner for every operational surface.

Current status: Phase 9/10 foundations are implemented through security headers, health/readiness checks, public feedback with consent and RLS, graceful error states, plain-language policy routes, sitemap coverage, CI validation, and a Railway deployment profile. Complete the environment separation, managed monitoring, restore drill, independent RLS matrix, policy review, and named-ownership checklist in `docs/PHASE_09_SECURITY.md` and `docs/PHASE_10_OPERATIONS.md` before production launch.

### Phase 11 — Resend email delivery

Goal: provide calm, useful, privacy-safe transactional communication.

Deliverables:

- Shared Resend delivery service with branded HTML and plain-text templates.
- Delivery ledger, deduplication keys, provider webhooks, and email preference foundations.
- Application coverage for support, feedback, engagement, event, giving, and marketplace workflows.

Acceptance: apply `supabase/migrations/0013_resend_email_delivery.sql`, configure Resend, connect Supabase Auth custom SMTP, register the signed webhook, and verify delivery and failure events in staging.

## Non-negotiable security rules

1. No service-role key in browser code.
2. Every exposed table has RLS enabled, explicit grants, and operation-specific policies.
3. Sensitive beneficiary data is never used as public content by default.
4. Payment card data is delegated to a compliant provider.
5. Staff privileges are least-privilege and MFA-protected.
6. Every sensitive export and administrative mutation is auditable.
7. Backups and restoration are tested, not merely configured.

## Recommended execution order

Complete Phase 1 before production content and Phase 2 before any private records or payments. Then work through Phases 3 to 8 in the order that funding and program operations require. Phase 9 is continuous but must be formally passed before public launch. Phase 10 begins with the first staging deployment and continues after launch.
