# Phase 3 — Public content and CMS workflows

Status: first implementation slice complete; media library, scheduling UI, and richer content types remain.

## Included in this slice

- Published programs are loaded from Supabase instead of being hard-coded in the public page.
- Program detail pages are available at `/programs/[slug]`.
- Published impact stories are loaded from Supabase and available at `/impact/[slug]`.
- Public story visibility requires `status = published` and recorded consent.
- Program and story SEO title/description fields are supported.
- Content editors and administrators have a protected `/dashboard/content` studio.
- Content creation and updates support draft, published, and archived states.
- Publishing a story without recorded consent is rejected server-side.
- Every content save creates a revision in `content_revisions`.
- Content editing requires an assigned content/editor/admin role and a verified MFA session.
- Program and story updates receive automatic `updated_at` timestamps.

## Supabase migration

Apply `supabase/migrations/0003_phase3_content_cms.sql` to the development project before testing the content studio. It adds editorial metadata, revision history, content-access helpers, and consent-aware public RLS policies.

## Verification checklist

1. Apply the Phase 3 migration.
2. Sign in with a content editor or administrator account that has completed MFA.
3. Open `/dashboard/content` and create a program draft.
4. Publish the program and confirm it appears on `/programs` and `/programs/[slug]`.
5. Create a story draft without consent and confirm publication is rejected.
6. Add recorded consent, publish, and confirm it appears on `/impact` and `/impact/[slug]`.
7. Edit the record and confirm a new revision is created.
8. Confirm an unauthenticated visitor cannot see drafts or non-consented stories.

## Remaining Phase 3 work

- Supabase Storage media library with private/public buckets and signed access.
- Upload validation, image transformations, alt-text workflow, and media consent metadata.
- News, events, reports, and resource content types.
- Review/approval queues separate from the editor save action.
- Scheduled publishing worker and editorial calendar.
- Sitemap, robots, Open Graph images, and structured metadata.
- English/Swahili translation workflow.
