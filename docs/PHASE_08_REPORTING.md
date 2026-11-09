# Phase 8 — Reporting, transparency, and measurement

## Shipped

- Indicator dictionary with units, definitions, population dimensions, targets, aggregation methods, and validation rules.
- Programme-indicator assignments and a staff-only observation collection form.
- Server-side validation for minimum, maximum, whole-number, date-range, source, county, and population fields.
- Data-quality records for rejected observations and an observation change-history trigger.
- Internal reporting workspace for recent observations, quality status, and public-metric approval.
- County, programme, and population dimensions are stored on observations and supported in the reporting model.
- Separate `public_impact_metrics` table; only explicitly approved aggregates are public.
- Public impact page with privacy-safe approved metrics and a reports/evidence page for approved annual, financial, programme, and evidence documents.
- Content Studio fields for report year, category, evidence label, and download path.
- RLS, explicit grants, AAL2 staff access, and audit events for reporting mutations.

## Operating boundary

Raw observations remain available only to verified reporting staff. Public pages read only approved aggregate records and approved editorial content; they never query beneficiary-level case records.

## Before production

- Agree the indicator dictionary and data-collection forms with programme owners and community representatives.
- Add a formal metric approval checklist and source-observation review before each public reporting cycle.
- Configure private evidence storage and signed download URLs for restricted documents; keep public reports in the public-media bucket only when disclosure is approved.
- Reconcile indicator observations against programme registers and finance records during the Phase 9 RLS and authorization regression tests.
