# Phase 7 — Engagement and participation

## Shipped

- Public engagement landing page with three clear routes: partner, volunteer, and events.
- Partner application form with organisation, focus area, counties, notes, consent, and pending status.
- Volunteer application form with skills, availability, county, consent, and pending status.
- Public event catalogue with dates, locations, capacity, deadlines, and registration links.
- Event registration function with duplicate-email protection, capacity-aware waitlisting, and authenticated-user association when available.
- Staff engagement dashboard for approved programme, marketplace, and administrator roles with MFA assurance.
- Staff workflows for application review, partner due diligence, programme assignment, volunteer assignment, and event attendance.
- Segmented in-app notifications for all users, roles, counties, and assigned programmes.
- Partner workspace that exposes only explicitly assigned programmes and referrals.
- RLS policies and explicit grants for all engagement tables.
- Three sample events seeded for local review.
- Homepage visual placements (`home_hero`, `home_story_main`, `home_story_support`) are wired to the approved media library.

## Image and visual refresh

- Marketplace products support `image_url` and `image_credit`.
- Three sample reference images are seeded and visibly labelled as references.
- Warm-paper, ink-teal, and terracotta palette replaces the previous pale-green-heavy treatment.
- Content editors and administrators can upload a replacement for each landing-page slot from Dashboard → Content Studio → Media Library; approval is required before it becomes live.

## Before production

- Replace sample imagery with rights-cleared maker uploads through the media library.
- Connect notification records to an approved email/SMS provider after consent, provider, and delivery-failure review.
- Publish rights-cleared guides and evidence files through the content studio.
- Complete RLS and authorization regression tests in Phase 9.
