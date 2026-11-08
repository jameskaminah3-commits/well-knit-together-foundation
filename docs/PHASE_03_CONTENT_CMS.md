# Phase 3 — Public content and CMS workflows

Status: complete.

## Included in this slice

- Published programs are loaded from Supabase instead of being hard-coded in the public page.
- Program detail pages are available at `/programs/[slug]`.
- Published impact stories are loaded from Supabase and available at `/impact/[slug]`.
- Public story visibility requires `status = published` and recorded consent.
- Program and story SEO title/description fields are supported.
- Content editors and administrators have a protected `/dashboard/content` studio.
- Content creation and updates support draft, pending-review, published, scheduled, and archived states.
- Publishing a story without recorded consent is rejected server-side.
- Every content save creates a revision in `content_revisions`.
- Content editing requires an assigned content/editor/admin role and a verified MFA session.
- Program and story updates receive automatic `updated_at` timestamps.
- News, events, reports, and resources are managed through the same editorial studio and public routes.
- Administrators with AAL2 can approve or return content; editors cannot bypass the review gate.
- Supabase Storage is configured with separate public-media and private-media buckets, file-size/MIME validation, alt text, and consent metadata.
- A media library uploads public images into an unpublished editorial queue.
- English/Swahili localisation records are editable per program, story, and content item.
- `/sitemap.xml`, `/robots.txt`, and a branded Open Graph image are available for search and sharing.

## Supabase migration

Apply `supabase/migrations/0003_phase3_content_cms.sql` followed by `supabase/migrations/0004_phase3_complete.sql` to the development project before testing the complete Phase 3 workflow. The final migration adds storage buckets and policies, content types, review state, scheduled publishing fields, media consent metadata, and localisation records.

## Verification checklist

1. Apply the Phase 3 migration.
2. Sign in with a content editor or administrator account that has completed MFA.
3. Open `/dashboard/content` and create a program draft.
4. Submit the program for review, approve it as an AAL2 administrator, and confirm it appears on `/programs` and `/programs/[slug]`.
5. Create a story draft without consent and confirm publication is rejected.
6. Add recorded consent, submit for review, approve it, and confirm it appears on `/impact` and `/impact/[slug]`.
7. Edit the record and confirm a new revision is created.
8. Create a news item, event, report, and resource; approve them and confirm their public routes and sitemap entries.
9. Upload a consented image in `/dashboard/content/media` and confirm it remains unpublished until approved.
10. Add a Swahili translation and verify it is stored against the content record.
11. Confirm an unauthenticated visitor cannot see drafts, scheduled content, unapproved media metadata, or non-consented stories.
