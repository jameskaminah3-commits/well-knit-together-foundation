# Phase 1 — Role and permission baseline

Access is granted to the smallest role that can complete the work. A role is not a substitute for row-level policies, server-side checks, or audit logging.

| Role | Main responsibility | Read access | Write access | High-risk restrictions |
| --- | --- | --- | --- | --- |
| Superadmin | Platform ownership and emergency control | All operational data | All configuration and assignments | MFA; no routine use for everyday case work |
| Admin | Organisation operations | Approved operational areas | Users, programs, content, assignments | Cannot expose payment secrets; sensitive exports audited |
| Program manager | Support, referrals, program delivery | Assigned program/county records | Support status, notes, referrals, resources | Cannot view unrelated finance or full user directory |
| Finance | Donations, receipts, reconciliation | Donation and finance records | Payment status, receipts, campaigns, finance reports | No unnecessary case details; exports logged |
| Marketplace manager | Products, makers, inventory, orders | Marketplace records | Products, stock, fulfilment, returns | Maker personal data minimised |
| Content editor | Public content and media | Content library and consent status | Draft, review, publish approved public content | Cannot access confidential case notes or payment data |
| Partner | Assigned collaboration | Explicitly assigned referrals/tasks | Progress updates on assigned work | No cross-partner visibility; agreement required |
| Volunteer | Events, tasks, training | Assigned tasks and public resources | Attendance/task updates | No confidential beneficiary records by default |
| Donor | Personal giving relationship | Own profile, donations, receipts | Preferences and communication consent | No access to other donor or beneficiary data |
| Beneficiary | Personal support relationship | Own profile, requests, referrals | Own requests and preferences | No access to case notes or other people’s records |

## Permission design rules

- A user can have multiple roles, but the effective permission must be the intersection of the requested action and the data scope.
- Program, county, partner, and assignment boundaries must be explicit data fields, not assumptions in UI code.
- Support records, child information, disability information, payment records, and identity documents are confidential by default.
- Every role change requires an actor, reason, timestamp, and audit record.
- Exports are separate permissions from viewing and require a reason and expiry where practical.
- Service-role credentials are server-only and never used in browser code.
