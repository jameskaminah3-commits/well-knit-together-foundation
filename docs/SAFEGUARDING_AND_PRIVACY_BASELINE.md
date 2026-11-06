# Phase 1 — Safeguarding and privacy baseline

This is a product baseline, not legal advice. The foundation should validate final policies and obligations with its designated data protection and safeguarding lead or qualified Kenyan counsel before collecting real beneficiary or child information.

## Data classification

### Public

Published programs, approved stories, public reports, approved contact channels, product listings, and general resources.

### Internal

Draft content, operational plans, staff assignments, partner agreements, internal notes, and unpublished metrics.

### Confidential

Support requests, referrals, disability or health information, child information, guardian details, identity documents, donor transactions, delivery details, and private contact information.

### Restricted secret

Payment credentials, service-role keys, encryption keys, webhook secrets, recovery codes, and incident evidence.

## Collection rules

- Collect only what is needed for a named purpose.
- Separate service intake from marketing consent and story consent.
- Give a plain-language explanation before collecting sensitive information.
- Offer a safe alternative contact method and avoid forcing a person to disclose more than needed.
- Do not request national ID numbers, medical records, or child details in a first public form unless the approved service workflow requires them.
- Do not place sensitive information in URLs, analytics events, email subjects, push notifications, or public search indexes.

## Child and vulnerable-person safeguards

- Treat child data as a high-risk workflow requiring a best-interest assessment, documented guardian process, and role-limited access.
- Never publish a child’s identifiable story or image from a support record by default.
- Use separate consent records for service delivery, photography/storytelling, and communications.
- Provide a withdrawal and correction route.
- Use human review for triage, eligibility, safeguarding flags, or any automated recommendation.
- Maintain a safeguarding escalation route for suspected abuse, exploitation, coercion, or immediate danger.

## Product requirements

- Consent records need purpose, version, method, date, subject, guardian relationship where applicable, and withdrawal state.
- Sensitive tables need RLS, explicit grants, access logging, and retention rules.
- Public story records must not be a view over confidential case tables.
- Uploaded media requires type/size validation, malware scanning in production, private storage by default, and signed URLs for restricted assets.
- Staff access to sensitive records must be reviewable.
- Breach and safeguarding incidents need a documented internal response path; the webapp should not expose incident details publicly.

## Accessibility and inclusion baseline

- Target WCAG 2.2 AA for public and authenticated interfaces.
- Keyboard access, visible focus, skip link, semantic headings, labels, error summaries, and logical tab order are mandatory.
- Do not rely on colour alone for status or required fields.
- Support zoom and reflow without loss of content.
- Provide captions/transcripts for meaningful audio/video.
- Use readable contrast and touch targets.
- Test with screen readers and reduced-motion preferences.
- Keep essential journeys usable on small screens and slow connections.
- Plain language is a safeguarding feature: users should understand what happens to their information.

## Reference standards

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Kenya ODPC rights of a data subject: https://www.odpc.go.ke/rights-of-a-data-subject/
- Kenya ODPC guidance on children’s data: https://www.odpc.go.ke/wp-content/uploads/2025/11/ODPC-%E2%80%93-Guidance-Note-for-Processing-Childrens-Data.pdf
- Kenya ODPC data protection compliance: https://www.odpc.go.ke/data-protection-compliance/
