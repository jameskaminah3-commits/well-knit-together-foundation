# Roles, permissions, and dashboards

Every person sees only what their work needs. Staff roles require two-step verification (an authenticator app) before any private record opens; this is enforced in the database, not just in the interface. One person can hold several roles, for example a donor who also volunteers.

The same guide is available inside the workspace at **/dashboard/roles**, and each person's overview shows what their own roles allow.

## At a glance

| Role | Who | Main workspace | Two-step verification | Assigned by |
| --- | --- | --- | --- | --- |
| Super administrator | Founder or chair's delegate | Payment settings, Administration | Required | Another super administrator |
| Administrator | Operations lead | Administration, Communications, every staff tool | Required | Super administrator |
| Program manager | Case and programme staff | Support cases, Engagement, Reporting | Required | Administrator |
| Finance | Treasurer, accountant | Finance, Shop orders, Reporting | Required | Administrator |
| Marketplace manager | Shop coordinator | Shop, Engagement | Required | Administrator |
| Content editor | Communications | Content studio, Media library | Required | Administrator |
| Donor | Regular supporters | My giving | No | Administrator (optional) |
| Partner | Member of an approved partner organisation | Partner workspace | No | Administrator, linked to an approved application |
| Volunteer | Approved volunteers | My volunteering | No | Administrator, optionally linked to an application |
| Caregiver / beneficiary | Families receiving support | My support requests | No | Administrator, with the caregiver's consent |

Anyone signed in, with or without a role, can see their own gifts, orders, and support requests.

## What each role can and cannot do

### Super administrator
- **Can:** everything an administrator can do; manage **Payment settings** (Paybill, Till, bank details, M-Pesa Daraja credentials, and the online giving switch); grant or remove super administrator access; read the full activity log.
- **Cannot:** remove the last super administrator, change their own roles, or read M-Pesa secrets after saving them. Secrets are encrypted and only the server can use them.

### Administrator
- **Can:** invite staff; grant and revoke staff and community roles (except super administrator); link partner and volunteer accounts to approved applications; approve content and public impact figures; approve case-data exports; see email delivery and the activity log.
- **Cannot:** change payment settings or grant super administrator access.

### Program manager
- **Can:** triage, assign, refer, and close support cases with private notes; review partner and volunteer applications and due diligence; assign people to programmes; mark attendance; send in-app updates; record indicator data and draft public figures.
- **Cannot:** see gifts or orders; publish content or figures without an administrator; export case data without approval.

### Finance
- **Can:** see every gift, receipt, and campaign total; **record gifts received directly** (Paybill, Till, bank, cheque, cash) so donors get a receipt and campaign totals stay right; update order payment status; see reporting data.
- **Cannot:** change payment settings, see support cases, or edit a confirmed gift.

### Marketplace manager
- **Can:** add and edit products, prices, stock, and featured items; move orders through paid, processing, fulfilled, cancelled, or refunded. Stock is consumed or released automatically. They can also help with engagement.
- **Cannot:** see gifts or support cases, or publish stories or news.

### Content editor
- **Can:** draft programmes, stories, news, events, resources, and reports; add Kiswahili translations; upload consented photos; submit for review.
- **Cannot:** publish without an administrator's approval; see cases, gifts, or orders.

### Donor, partner, volunteer, caregiver
- **Donor:** their own gifts, receipt numbers, orders, and email preferences.
- **Partner:** programmes assigned to their organisation; **accept, decline, or complete referrals** and record the outcome; partner updates. They never see caregivers' contact details or case notes.
- **Volunteer:** their applications, assignments, events, and volunteer updates.
- **Caregiver:** their own support requests and events, and messages in English or Kiswahili.

## Dashboard audit, November 2026

Each workspace was tested on a local Supabase stack (`supabase start`) by signing in as every demo account in a browser, enrolling an authenticator for staff, and carrying out each role's main tasks: 59 checks, all passing, including an M-Pesa gift from PIN prompt to receipt against a mock Daraja. The database-level version is `supabase/tests/role_access.sql` (36 checks).

| Area | Problem found | Fix |
| --- | --- | --- |
| Support cases | **Adding a case note always failed.** The shared audit trigger read a referral-only field. | Migration `0016` |
| Engagement | **Event registrations and attendance were unreadable for every role**, including staff. A policy queried a table the signed-in role cannot read. | Migration `0017` |
| Audit trail | Entries written from staff sessions (metric approvals, application reviews) were silently rejected. Admins also had no way to read the log. | Migration `0017` and an activity log in Administration |
| Feedback | The super administrator could not read site feedback. | Migration `0017` |
| Shop | **Marketplace managers had no workspace and no permission to edit products.** Stock reserved at checkout was never consumed or released, so items drifted towards "sold out". | Migration `0018`, new **Shop** workspace, and `set_marketplace_order_status()` |
| Partners | No way to link a partner's account to their organisation, so the partner workspace was unreachable; partners also could not respond to referrals. | Administration linking, `partner_update_referral()`, and response forms |
| Volunteers, caregivers | No workspace for volunteers. "My support requests" was missing from navigation. | **My volunteering** page; grouped navigation |
| Donors | "My giving" was hidden unless the account held the donor role, though anyone can give. | Shown to every signed-in person |
| Administration | Only staff roles could be granted; community roles were impossible to assign. | Community roles with application linking |
| Finance | Gifts received by Paybill or bank never got a receipt or counted towards a campaign. | **Record a direct gift** form with duplicate protection |
| Payments | Online giving depended on a server flag, with no real provider behind it. | Super administrator **Payment settings** and M-Pesa Express (STK Push) |
| Language | Internal "Phase 4/5/7/8" labels; "Kisumu" placeholders. | Removed; served counties used throughout |
| Content studio | **Editors could not create or edit programmes or stories**, and approving a programme always failed (it set a column programmes do not have). | Migration `0019`; review endpoint fixed |
| Engagement | **Staff could not approve or decline partner and volunteer applications** (policy without a table privilege). | Migration `0019` |
| Sign-in | **Staff were locked out of staff tools after their first session**: nothing asked for the authenticator code on later sign-ins. | `/auth/verify` step after sign-in, magic link, and invite; "Verify this session" prompts |
| Sign-in | Eight sign-ins per 15 minutes per network locked out a shared office or training room. | Limit per account, with a looser cap per network |

## Demo accounts

`supabase/seed.sql` creates one account per role (password `WellKnit-Demo-2026!`), listed at the top of that file. See `docs/LOCAL_DEVELOPMENT.md`. Never load the seed into production; it refuses to run where real accounts exist, and `supabase/remove_demo_seed.sql` removes it from a staging project.
