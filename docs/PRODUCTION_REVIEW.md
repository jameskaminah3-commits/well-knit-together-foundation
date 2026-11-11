# Production review — November 2026

End-to-end review of the public site, giving, marketplace, support intake, staff workspace, database migrations, and launch readiness, measured against the foundation's registration record (NGOs Co-ordination Board, **NGO-KJUYVK4**).

## What the registration says the product must serve

- **Registered objective:** improve the well-being, capacity, and economic empowerment of women caregivers of children with disabilities through support services, training, and community inclusion.
- **Who it helps:** caregivers of vulnerable groups (OVCs, older people, people living with HIV), orphans and vulnerable children, people with disabilities, women facing poverty, and the wider community.
- **How it works:** community training, facilities, equipment and materials, school fees and learning materials, and advocacy, information, and advice.
- **Where:** Mombasa, Kilifi, Kwale, Tana River, and Kajiado. Office in Nyali, Mombasa. P.O. Box 93175–80102.
- **Governance:** chairperson, secretary, treasurer, and two board members. Financial year 1 January – 31 December.

The people most likely to use the site are caregivers on low-cost Android phones (often on mobile data, many more comfortable in Kiswahili), donors and diaspora supporters checking whether the foundation is legitimate, and partner organisations doing due diligence.

## Fixed in this review

### Critical (would have failed real users at launch)

| Issue | Impact | Fix |
| --- | --- | --- |
| Every public form crashed after a **successful** submit (`event.currentTarget` read after `await`) | Caregivers never saw their support reference number; the button stuck on "Sending…", inviting duplicate requests. Same for partner, volunteer, event, and feedback forms, plus two staff forms that showed a false error after saving. | Capture the form element before awaiting in all seven handlers. Verified in a browser. |
| Seeded **fake content went live**: a fictional "Kisumu maker collective" with recorded consent, three products photographed by other businesses (Etsy, Mayan Hands, Copper Beech), three events with real dates in Kisumu and Nairobi, and a KES 500,000 placeholder appeal | Misrepresentation to donors and buyers, copyright exposure, and people registering for events that do not exist—outside the registered counties | Migration `0014_production_content_hygiene.sql` archives (never deletes) the sample records. Preview fallbacks now render only in local development. |
| Homepage photographs were **hotlinked from three third-party websites** and labelled "Sample editorial reference" | Copyright risk, broken images if those sites change, and photographs implying they show the foundation's beneficiaries | Original brand artwork (circle of people joined by braided threads) ships as the default. Consented photos uploaded through the media library still take priority. Third-party hosts removed from `next.config.ts`. |
| **Donate was a dead end** in production: donors filled the form, then got "temporarily unavailable" | Every gift lost | When online checkout is not enabled, `/donate` shows M-Pesa Paybill/Till and bank details (from environment variables) or, if those are not set yet, a clear way to contact the team to give. |
| Every **"Read report" link returned 404** (reports were routed to `/resources/[slug]`, which rejected them); the sitemap listed the same broken URLs | Accountability documents unreachable | New `/reports/[slug]` page; sitemap corrected. |
| **No contact details anywhere.** Privacy, terms, and safeguarding pages sent users to `/about#contact`, which said contacts were "to be confirmed" | No way to reach the foundation; fails donor due diligence and data-protection duties | New `/contact` page, registration details in the footer and on every legal page, and configurable phone, WhatsApp, and email. |

### High

- **Open redirect** after sign-in: `/\evil.example` passed the `//` check. Shared `safeNextPath` now rejects backslashes and control characters (login page, sign-in API, auth callback).
- **Past events stayed listed** with open registration; events also **disappeared from the public site as soon as registration closed**, before they had happened (RLS policy). Both fixed; registration is still enforced by the database function.
- **Contact consent trap** on support requests: a caregiver could type a phone number, forget the consent box, and have the number silently discarded. The form now explains what to do, and the API rejects consent without a usable phone number or email.
- **County field was free text with "e.g. Kisumu"** (not a served county). It is now a list of the five registered counties plus "Another county".
- **Marketplace checkout** asked for delivery details before revealing that sign-in was required, then returned 503 in production. It now shows the right next step up front: sign in, or contact us to order while checkout is offline.

### Experience, brand, and messaging

- Homepage rewritten around the registered mission: *"No caregiver should carry it alone."* It gives caregivers a direct "Get support" path and donors a direct "Support a caregiver" path, and adds a Kiswahili welcome band, the five registered ways of working, the five counties, the four outcomes, and four ways to get involved.
- Removed vanity statistics ("01 caregiver-centred foundation", "∞ possibilities") and the "four ways" heading that sat above three cards.
- **Kiswahili** on the support journey (labels, options, confirmation), the homepage, and key headings. Caregivers can write requests in Kiswahili.
- **Kenyan emergency helplines** (999/112, Childline 116, GBV 1195) on the support and safeguarding pages.
- Navigation cut from 11 crowded items to 6, with persistent "Get support" and "Donate" buttons. On tablets the old nav wrapped onto two lines. The mobile menu now closes after you tap a link and responds to Escape.
- Typography: **Atkinson Hyperlegible** (designed with the Braille Institute for low-vision readers) for body text and Fraunces for headings, both self-hosted by `next/font`. Contrast was raised so all text passes WCAG AA, form controls are at least 46px tall, and there is an original logo mark and favicon.
- About page now includes governance: board roles, registration card, and financial year.
- Privacy notice rewritten for the **Data Protection Act, 2019**: sensitive health and disability data, children's data, international transfers, rights, and the ODPC complaint route.
- SEO: NGO JSON-LD with registration number and areas served; per-page titles, descriptions, and canonicals; refreshed social share image; complete sitemap.
- Staff workspace: removed internal "Phase 4/5/7/8" labels. The overview now shows only the tools a person's role can open and prompts staff to turn on two-step verification.

## Launch blockers only the foundation can resolve

1. **Official contact channels.** Set `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_WHATSAPP`, `NEXT_PUBLIC_CONTACT_EMAIL`, and `NEXT_PUBLIC_SAFEGUARDING_EMAIL` in Railway, then redeploy (they are read at build time). The registration record lists the chairperson's personal mobile as the organisation's telephone; a dedicated foundation line and inbox are strongly recommended.
2. **Giving details.** Set the Paybill/Till and bank variables. Use only accounts registered in the foundation's name.
3. **Connect M-Pesa.** Online giving now uses M-Pesa Express (STK Push). The super administrator saves the Daraja credentials under **Payment settings**, tests the connection, and switches online giving on. Start in the Daraja sandbox, then switch to production credentials once Safaricom has approved the shortcode for M-Pesa Express. `PAYMENT_ENCRYPTION_KEY`, `PAYMENT_WEBHOOK_SECRET`, and an https `NEXT_PUBLIC_SITE_URL` are required.
4. **Apply migrations `0014` to `0019`** to the production Supabase project. Never load `supabase/seed.sql` there.
5. **Content:** publish real programs, consented stories, and homepage photographs through the content studio and media library. Publish the first annual report after the financial year closes on 31 December.
6. **Data protection:** register with the ODPC as a data controller (charitable organisations processing health data are generally required to), have counsel review the privacy notice, and name a data-protection contact.
7. **Safeguarding:** adopt a written policy, name a safeguarding lead, set the safeguarding email, and review the helpline numbers every year.
8. **Board listing consent:** the About page lists board members' names and roles only (no ID numbers, emails, or phones). Confirm each person is happy to be listed, or edit `leadership` in `src/lib/site.ts`.
9. **Regulatory wording:** the Public Benefit Organizations Act, 2013 commenced in May 2024, and the NGOs Co-ordination Board is transitioning to the PBO Regulatory Authority. Confirm with the regulator or counsel whether the public registration wording should change.
10. **Kiswahili review:** have a native speaker review the translations, then extend Kiswahili to programs, about, and donate.
11. **Email:** complete Resend domain verification (see `docs/PHASE_11_EMAIL_DELIVERY.md`).

## Marketing recommendations

- **Lead with legitimacy.** The registration number, board, and published reports are the strongest conversion tools for Kenyan and diaspora donors. Keep them visible.
- **Make M-Pesa the default ask** for local supporters, with a short Paybill and a memorable account name. Share it on WhatsApp Status and in church and mosque networks.
- **Create a Google Business Profile** for the Nyali office so "disability support Mombasa" and similar searches surface the foundation.
- **Tell one consented story per quarter** (a caregiver's own words, a photo she approves, one number), and post a short impact snapshot to `/impact`.
- **Partner where families already go:** county disability units, the National Council for Persons with Disabilities (NCPWD), Educational Assessment and Resource Centres (EARCs), and special schools and units. They are referral sources, credibility, and co-funding.
- **Position the shop as gifting:** corporate and event hampers make dependable bulk orders for caregiver-makers.

## How this was verified

- `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- Playwright on a production build at 1280px, 1000px, and iPhone 13 widths: no horizontal overflow; nav fits at every width; the mobile menu closes on navigation.
- Form journeys exercised against mocked APIs (support with the consent check and reference number, feedback, partner).
- Every public route returns 200; sample products and events return 404 in production.
- DOM audit across 17 pages: no unlabelled controls, missing alt text, empty links, or skipped heading levels.
- WCAG contrast computed for all text and background pairs (≥ 4.5:1).

## Follow-up: role dashboards and payments (November 2026)

A second pass signed in as every role against the real database rules. It found and fixed four database bugs that broke staff workspaces:

- Case notes could not be saved.
- Event registrations were unreadable for everyone.
- Audit entries from staff sessions were dropped.
- Shop stock reservations never cleared.

It also filled missing workspaces: Shop, My volunteering, partner referral responses, finance's direct-gift recording, and community role assignment. Super administrator payment settings and M-Pesa Express were added too. Details are in `docs/ROLES.md`; `supabase/tests/role_access.sql` runs 36 access checks.

### Local end-to-end run (November 2026)

All 19 migrations and the seed were applied to the official local Supabase stack. A browser then signed in as each of the ten demo accounts and carried out their main tasks: 59 of 59 checks pass. The run found and fixed five more problems that only show up when signed in:

- Content editors could not save programmes or stories, and programme approval always failed.
- Staff could not approve partner or volunteer applications.
- Staff had no way to enter their authenticator code on later sign-ins.
- The sign-in limit would lock out a shared office network.
- The browser security policy blocked a Supabase project on a custom or local address.
