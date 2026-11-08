# Phase 4 — Support, referrals, and beneficiary services

Status: implementation slice complete; live Supabase migration and safeguarding/provider review remain before production acceptance.

## What is implemented

- Public `/support` intake that works without an account.
- Signed-in account submissions associated with the authenticated requester.
- Verified case staff can create assisted submissions from `/dashboard/support`.
- County, beneficiary population, need category, urgency, description, preferred contact method, contact consent, and optional contact details.
- Anonymous submissions cannot be read back by the public. Requesters can only read their own authenticated records.
- AAL2 program managers, administrators, and superadmins can triage cases.
- Case status, assignment-to-self, follow-up date, closure reason, safeguarding flag/summary, internal notes, and referral partner records.
- Append-only case event records for creation, status, assignment, follow-up, redaction, notes, and referrals.
- Retention deadline and a redaction function for removing contact and narrative data after the retention period.
- Private CSV export requests with a separate AAL2 administrator approval and one-hour expiry.
- Export fields are intentionally minimal: no contact details, safeguarding summaries, notes, referral contacts, or case narratives.
- No SMS, email, or WhatsApp sending is enabled. Those integrations require consent language, provider review, delivery failure handling, and a separate approval before activation.

## Supabase migration

Apply `supabase/migrations/0005_phase4_support_services.sql` after the Phase 1–3 migrations. The migration tightens the existing support-request policies, adds the case/referral/note/export tables, and adds retention and safeguarding fields.

The retention function is deliberately not exposed to browser roles. Schedule it only after the foundation approves an operational retention policy and a reviewed server-side job.

## Verification checklist

1. Submit `/support` anonymously with no contact details. Confirm a reference is returned, but no public read endpoint exists.
2. Submit while signed in. Confirm the requester can see only their own record; a different signed-in user cannot see it.
3. Sign in as an AAL2 program manager and confirm `/dashboard/support` loads the case queue.
4. Create an assisted case and confirm it is marked `submission_channel = assisted`.
5. Move a case through `new`, `in_review`, `referred`, `in_progress`, `resolved`, and `closed`; add a follow-up date and closure reason.
6. Add an internal note and a referral partner. Confirm they are not visible to the requester or public visitor.
7. Mark a safeguarding flag and confirm the summary is required.
8. Request an export as case staff. Confirm it stays pending until an AAL2 administrator approves it.
9. Download the approved export and confirm it expires after one hour and excludes contact details and narratives.
10. Test an expired retention row in a non-production project before scheduling reviewed redaction.

## Before production acceptance

- Agree the safeguarding escalation protocol and the named responsible roles.
- Set the retention period with legal/safeguarding advice and document the approved redaction schedule.
- Confirm the county list, referral directory, emergency wording, and assisted-submission operating procedure.
- Complete provider review before enabling any outbound SMS, email, or WhatsApp workflow.
