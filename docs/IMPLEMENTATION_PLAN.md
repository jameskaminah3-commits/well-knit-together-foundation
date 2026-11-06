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
