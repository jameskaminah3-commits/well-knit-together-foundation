-- =============================================================================
-- Well Knit Together · DEMO SEED
-- =============================================================================
-- For local development (`supabase db reset`) and staging only.
-- Every person, organisation, story, gift, and case below is fictional.
-- Pictures are original illustrations in public/demo (products and covers).
--
-- Demo accounts (all use the password  WellKnit-Demo-2026!):
--   superadmin@demo.wellknit.test   Amani Mwakio        Super administrator
--   admin@demo.wellknit.test        Rehema Chari        Administrator
--   programs@demo.wellknit.test     Zawadi Kahindi      Program manager
--   finance@demo.wellknit.test      Baraka Mwinyi       Finance
--   shop@demo.wellknit.test         Saumu Bakari        Marketplace manager
--   editor@demo.wellknit.test       Neema Wairimu       Content editor
--   donor@demo.wellknit.test        Ruth Kamau          Donor
--   partner@demo.wellknit.test      Fatma Said          Partner (Pwani Inclusive Therapy Collective)
--   volunteer@demo.wellknit.test    Brian Kiprono       Volunteer
--   caregiver@demo.wellknit.test    Mwanajuma Hamisi    Beneficiary (caregiver)
--
-- Staff tools require two-step verification: sign in, open Security, and
-- enrol an authenticator app before opening staff workspaces.
--
-- The seed refuses to run on a database that already has any real user account.
-- To clean a staging project before launch, run supabase/remove_demo_seed.sql.
-- =============================================================================

begin;

do $$
begin
  if exists (select 1 from auth.users where email is not null and email not like '%@demo.wellknit.test') then
    raise exception 'Refusing to load demo seed: this database already has real user accounts. Demo data belongs in local or staging databases only.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Demo accounts
-- -----------------------------------------------------------------------------
do $$
declare
  account record;
begin
  for account in
    select * from (values
      ('d1000000-0000-4000-8000-000000000001'::uuid, 'superadmin@demo.wellknit.test', 'Amani Mwakio', '+254 700 100 001', 'Mombasa', 'superadmin'::public.app_role),
      ('d1000000-0000-4000-8000-000000000002'::uuid, 'admin@demo.wellknit.test', 'Rehema Chari', '+254 700 100 002', 'Mombasa', 'admin'::public.app_role),
      ('d1000000-0000-4000-8000-000000000003'::uuid, 'programs@demo.wellknit.test', 'Zawadi Kahindi', '+254 700 100 003', 'Kilifi', 'program_manager'::public.app_role),
      ('d1000000-0000-4000-8000-000000000004'::uuid, 'finance@demo.wellknit.test', 'Baraka Mwinyi', '+254 700 100 004', 'Mombasa', 'finance'::public.app_role),
      ('d1000000-0000-4000-8000-000000000005'::uuid, 'shop@demo.wellknit.test', 'Saumu Bakari', '+254 700 100 005', 'Kwale', 'marketplace_manager'::public.app_role),
      ('d1000000-0000-4000-8000-000000000006'::uuid, 'editor@demo.wellknit.test', 'Neema Wairimu', '+254 700 100 006', 'Mombasa', 'content_editor'::public.app_role),
      ('d1000000-0000-4000-8000-000000000007'::uuid, 'donor@demo.wellknit.test', 'Ruth Kamau', '+254 700 100 007', 'Nairobi', 'donor'::public.app_role),
      ('d1000000-0000-4000-8000-000000000008'::uuid, 'partner@demo.wellknit.test', 'Fatma Said', '+254 700 100 008', 'Mombasa', 'partner'::public.app_role),
      ('d1000000-0000-4000-8000-000000000009'::uuid, 'volunteer@demo.wellknit.test', 'Brian Kiprono', '+254 700 100 009', 'Mombasa', 'volunteer'::public.app_role),
      ('d1000000-0000-4000-8000-000000000010'::uuid, 'caregiver@demo.wellknit.test', 'Mwanajuma Hamisi', '+254 700 100 010', 'Mombasa', 'beneficiary'::public.app_role)
    ) as rows(id, email, display_name, phone, county, role)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', account.id, 'authenticated', 'authenticated', account.email,
      extensions.crypt('WellKnit-Demo-2026!', extensions.gen_salt('bf')), timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('display_name', account.display_name),
      timezone('utc', now()) - interval '200 days', timezone('utc', now()), '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), account.id, account.id::text, jsonb_build_object('sub', account.id::text, 'email', account.email, 'email_verified', true), 'email', timezone('utc', now()), timezone('utc', now()), timezone('utc', now()))
    on conflict (provider_id, provider) do nothing;

    insert into public.profiles (id, display_name, phone, county, preferred_language)
    values (account.id, account.display_name, account.phone, account.county, case when account.role = 'beneficiary' then 'sw' else 'en' end)
    on conflict (id) do update set display_name = excluded.display_name, phone = excluded.phone, county = excluded.county, preferred_language = excluded.preferred_language;

    insert into public.user_roles (user_id, role) values (account.id, account.role) on conflict do nothing;
  end loop;
end $$;

-- A donor who also volunteers shows how roles combine.
insert into public.user_roles (user_id, role) values ('d1000000-0000-4000-8000-000000000007', 'volunteer') on conflict do nothing;

insert into public.email_preferences (user_id, preferred_language, event_updates, support_updates, giving_updates, marketplace_updates, impact_updates, marketing_opt_in)
values
  ('d1000000-0000-4000-8000-000000000007', 'en', true, false, true, true, true, true),
  ('d1000000-0000-4000-8000-000000000010', 'sw', true, true, false, false, false, false)
on conflict (user_id) do nothing;

-- -----------------------------------------------------------------------------
-- Programs, with Kiswahili translations
-- -----------------------------------------------------------------------------
insert into public.programs (slug, title, summary, description, focus_groups, counties, status, review_status, default_language, seo_title, seo_description, created_by, reviewed_by, reviewed_at)
values
  ('caregiver-support', 'Caregiver support',
   'Peer circles, home-care skills, assistive equipment, and referrals for women caring for children with disabilities.',
   'Every fortnight, caregivers meet in a circle in their own ward: to rest, learn a practical skill, and leave with a plan. Between circles, our team follows up by phone, links families to clinics and assessment centres, and provides assistive equipment where it changes a child''s day.',
   array['caregiver_disability', 'caregiver_vulnerable_group']::public.beneficiary_group[], array['Mombasa', 'Kilifi', 'Kwale', 'Tana River', 'Kajiado'],
   'published', 'approved', 'en', 'Caregiver support program', 'Peer circles, home-care skills, equipment and referrals for caregivers of children with disabilities in coastal Kenya and Kajiado.',
   'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '120 days'),
  ('skills-livelihoods', 'Skills and livelihoods',
   'Weaving, beadwork, tailoring, and small-business training so caregivers can earn an income that fits around care.',
   'Caregivers choose a craft or trade, train with experienced makers, and sell through group stalls and our online shop. Groups set prices together, keep simple records, and decide how to reinvest. Childcare is provided during sessions so that mothers can attend.',
   array['economically_vulnerable_woman', 'caregiver_disability']::public.beneficiary_group[], array['Mombasa', 'Kilifi', 'Kajiado'],
   'published', 'approved', 'en', 'Skills and livelihoods program', 'Craft and small-business training for women caregivers, with fair routes to market.',
   'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '118 days'),
  ('education-advocacy', 'Education and advocacy',
   'School fees, uniforms, learning materials, and advocacy so children with disabilities are in class and included.',
   'We pay fees and buy learning materials for children who would otherwise stay home, support families through educational assessment, and work with head teachers on ramps, seating, and inclusive teaching. Caregivers are trained to speak up at school boards and county forums.',
   array['orphan_vulnerable_child', 'person_with_disability', 'wider_community']::public.beneficiary_group[], array['Mombasa', 'Kilifi', 'Kwale', 'Tana River'],
   'published', 'approved', 'en', 'Education and advocacy program', 'School fees, learning materials and inclusion advocacy for children with disabilities.',
   'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '115 days')
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, description = excluded.description, focus_groups = excluded.focus_groups,
  counties = excluded.counties, status = excluded.status, review_status = excluded.review_status, seo_title = excluded.seo_title, seo_description = excluded.seo_description;

-- A program waiting for review shows the editorial gate.
insert into public.programs (slug, title, summary, description, focus_groups, counties, status, review_status, default_language, created_by)
values ('respite-care', 'Respite care pilot', 'Short, trusted breaks for caregivers through trained community carers.', 'A pilot in Likoni pairing trained community carers with families for half-day breaks twice a month.', array['caregiver_disability']::public.beneficiary_group[], array['Mombasa'], 'draft', 'pending_review', 'en', 'd1000000-0000-4000-8000-000000000006')
on conflict (slug) do nothing;

insert into public.content_localizations (entity_type, entity_id, language, title, summary, body, created_by)
select 'program', programs.id, 'sw', translations.title, translations.summary, translations.body, 'd1000000-0000-4000-8000-000000000006'
from public.programs
join (values
  ('caregiver-support', 'Msaada kwa walezi', 'Vikundi vya walezi, mafunzo ya malezi nyumbani, vifaa saidizi na rufaa kwa akina mama wanaolea watoto wenye ulemavu.', 'Kila wiki mbili, walezi hukutana katika kikundi kwenye kata yao: kupumzika, kujifunza ujuzi, na kuondoka na mpango.'),
  ('skills-livelihoods', 'Ujuzi na kipato', 'Mafunzo ya ufumaji, ushanga, ushonaji na biashara ndogo ili walezi wapate kipato kinachoendana na malezi.', 'Walezi huchagua ufundi, hujifunza kutoka kwa mafundi wenye uzoefu, na kuuza kupitia vibanda vya vikundi na duka letu la mtandaoni.'),
  ('education-advocacy', 'Elimu na utetezi', 'Karo, sare, vifaa vya masomo na utetezi ili watoto wenye ulemavu wawe darasani na wajumuishwe.', 'Tunalipa karo na kununua vifaa vya masomo kwa watoto ambao vinginevyo wangebaki nyumbani.')
) as translations(slug, title, summary, body) on translations.slug = programs.slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Indicators and outcomes
-- -----------------------------------------------------------------------------
insert into public.indicator_dictionary (code, name, definition, unit, population_dimension, validation_rules)
values
  ('caregiver_learning_sessions', 'Caregiver learning sessions', 'Completed facilitated learning sessions recorded in the programme register.', 'sessions', 'all', '{"min":0,"whole_number":true}'),
  ('makers_supported', 'Makers supported', 'People receiving documented livelihood or market-readiness support during the reporting period.', 'people', 'economically_vulnerable_woman', '{"min":0,"whole_number":true}'),
  ('support_requests_resolved', 'Support requests resolved', 'Support requests closed with a documented resolution or referral outcome.', 'requests', 'all', '{"min":0,"whole_number":true}'),
  ('event_attendance_rate', 'Event attendance rate', 'Share of registered participants marked as attended for a published gathering.', 'percent', 'all', '{"min":0,"max":100}'),
  ('community_inclusion_score', 'Community inclusion score', 'Validated participant-reported inclusion score using the approved programme questionnaire.', 'score', 'wider_community', '{"min":0,"max":5}')
on conflict (code) do update set name = excluded.name, definition = excluded.definition, unit = excluded.unit, population_dimension = excluded.population_dimension, validation_rules = excluded.validation_rules;

insert into public.program_indicators (program_id, indicator_id, target, target_period, aggregation)
select program.id, dictionary.id, case dictionary.code when 'event_attendance_rate' then 80 when 'caregiver_learning_sessions' then 60 when 'makers_supported' then 50 else null end, '2026',
       case when dictionary.code = 'event_attendance_rate' then 'average' else 'sum' end
from public.programs program
cross join public.indicator_dictionary dictionary
where program.status = 'published' and dictionary.active = true
on conflict (program_id, indicator_id) do nothing;

insert into public.indicator_observations (id, program_indicator_id, county, beneficiary_group, reporting_period_start, reporting_period_end, value, source, notes, validation_status, entered_by, approved_by, approved_at)
select observation.id::uuid, assignment.id, observation.county, observation.grp::public.beneficiary_group, observation.period_start::date, observation.period_end::date, observation.value, observation.source, observation.notes, observation.validation,
       'd1000000-0000-4000-8000-000000000003', case when observation.validation = 'approved' then 'd1000000-0000-4000-8000-000000000002'::uuid end, case when observation.validation = 'approved' then timezone('utc', now()) - interval '10 days' end
from (values
  ('dd000000-0000-4000-8000-000000000001', 'caregiver-support', 'caregiver_learning_sessions', 'Mombasa', 'caregiver_disability', '2026-07-01', '2026-09-30', 21, 'Circle attendance register', 'Likoni and Kisauni circles.', 'approved'),
  ('dd000000-0000-4000-8000-000000000002', 'caregiver-support', 'caregiver_learning_sessions', 'Kilifi', 'caregiver_disability', '2026-07-01', '2026-09-30', 14, 'Circle attendance register', 'Mtwapa and Kilifi town.', 'approved'),
  ('dd000000-0000-4000-8000-000000000003', 'caregiver-support', 'caregiver_learning_sessions', 'Kajiado', 'caregiver_disability', '2026-07-01', '2026-09-30', 11, 'Circle attendance register', 'Kitengela circle.', 'approved'),
  ('dd000000-0000-4000-8000-000000000004', 'skills-livelihoods', 'makers_supported', 'Kilifi', 'economically_vulnerable_woman', '2026-01-01', '2026-09-30', 23, 'Maker training register', 'Kadzo Weavers and two new groups.', 'approved'),
  ('dd000000-0000-4000-8000-000000000005', 'skills-livelihoods', 'makers_supported', 'Kajiado', 'economically_vulnerable_woman', '2026-01-01', '2026-09-30', 15, 'Maker training register', 'Naserian Beadwork Circle.', 'approved'),
  ('dd000000-0000-4000-8000-000000000006', 'caregiver-support', 'support_requests_resolved', null, null, '2026-01-01', '2026-09-30', 112, 'Case management system export', 'Closed with documented outcome or referral.', 'approved'),
  ('dd000000-0000-4000-8000-000000000007', 'caregiver-support', 'event_attendance_rate', 'Mombasa', null, '2026-07-01', '2026-09-30', 84, 'Event attendance records', 'Three circles and one maker studio.', 'approved'),
  ('dd000000-0000-4000-8000-000000000008', 'education-advocacy', 'community_inclusion_score', 'Kwale', 'wider_community', '2026-10-01', '2026-10-31', 3.6, 'Inclusion questionnaire, Ukunda schools', 'Awaiting second reviewer.', 'pending')
) as observation(id, program_slug, indicator_code, county, grp, period_start, period_end, value, source, notes, validation)
join public.programs on programs.slug = observation.program_slug
join public.indicator_dictionary on indicator_dictionary.code = observation.indicator_code
join public.program_indicators assignment on assignment.program_id = programs.id and assignment.indicator_id = indicator_dictionary.id
on conflict (id) do nothing;

insert into public.public_impact_metrics (id, metric_key, label, value, unit, period_label, county, beneficiary_group, program_id, public_note, status, approved_by, approved_at, created_by)
values
  ('dd100000-0000-4000-8000-000000000001', 'caregivers_in_circles_2026', 'Caregivers meeting in support circles', 146, 'caregivers', '2026, January to September', null, 'caregiver_disability', (select id from public.programs where slug = 'caregiver-support'), 'Women attending at least three circle sessions across five counties. Illustrative demo figure.', 'approved', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '9 days', 'd1000000-0000-4000-8000-000000000003'),
  ('dd100000-0000-4000-8000-000000000002', 'children_school_fees_2026', 'Children kept in school with fees and materials', 63, 'children', '2026 school year', null, 'orphan_vulnerable_child', (select id from public.programs where slug = 'education-advocacy'), 'Fees, uniforms and learning materials paid directly to schools. Illustrative demo figure.', 'approved', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '9 days', 'd1000000-0000-4000-8000-000000000003'),
  ('dd100000-0000-4000-8000-000000000003', 'assistive_devices_2026', 'Assistive devices provided', 41, 'devices', '2026, January to September', null, 'person_with_disability', (select id from public.programs where slug = 'caregiver-support'), 'Wheelchairs, standing frames, and seating fitted with a physiotherapist. Illustrative demo figure.', 'approved', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '9 days', 'd1000000-0000-4000-8000-000000000003'),
  ('dd100000-0000-4000-8000-000000000004', 'makers_earning_2026', 'Caregiver-makers earning from their craft', 38, 'makers', '2026, January to September', null, 'economically_vulnerable_woman', (select id from public.programs where slug = 'skills-livelihoods'), 'Makers with at least one recorded sale. Illustrative demo figure.', 'approved', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '9 days', 'd1000000-0000-4000-8000-000000000003'),
  ('dd100000-0000-4000-8000-000000000005', 'inclusion_score_kwale', 'Inclusion score in partner schools', 3.6, 'out of 5', 'October 2026', 'Kwale', 'wider_community', (select id from public.programs where slug = 'education-advocacy'), 'Draft: awaiting a second review of the questionnaire data.', 'draft', null, null, 'd1000000-0000-4000-8000-000000000003')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Stories (fictional, illustrative)
-- -----------------------------------------------------------------------------
insert into public.stories (id, slug, title, excerpt, body, status, review_status, consent_recorded, published_at, default_language, seo_title, seo_description, created_by, reviewed_by, reviewed_at)
values
  ('d2000000-0000-4000-8000-000000000001', 'from-one-basket-to-a-business', 'From one basket to a business',
   'Kadzo wove her first kiondo during a caregivers'' circle in Kilifi. A year later, eight mothers share a stall—and a savings plan.',
   E'Kadzo''s daughter, Zuhura, was born with Down syndrome. For the first five years Kadzo stopped selling fish at the market, because there was no one she trusted to care for Zuhura while she worked.\n\nShe joined a caregivers'' circle in Kilifi town to meet other mothers. "I came to listen," she says. "I stayed because someone taught me to weave."\n\nToday Kadzo leads Kadzo Weavers, a group of eight caregivers who weave kiondo baskets in the shade of the community hall while their children play nearby. They price their work together, keep a shared record book, and sell at the Saturday market and through our online shop.\n\n"Zuhura sits with us and sorts the colours," Kadzo says. "She thinks she is the manager."\n\nIllustrative story created for the demo environment.',
   'published', 'approved', true, timezone('utc', now()) - interval '40 days', 'en', 'From one basket to a business', 'How a caregivers'' circle in Kilifi became a weaving business for eight mothers.', 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '41 days'),
  ('d2000000-0000-4000-8000-000000000002', 'a-ramp-a-classroom-a-first-day', 'A ramp, a classroom, a first day',
   'Omari uses a wheelchair. Until this term, the step into his classroom in Mtwapa was the end of the road.',
   E'Omari is nine and loves maths. Last year he studied at home because the classroom had a high step and the latrine was too narrow for his wheelchair.\n\nHis mother, Amina, raised it at a parents'' meeting after an advocacy session in her caregivers'' circle. The head teacher agreed, a local fundi volunteered his labour, and the foundation paid for cement and a grab rail.\n\nOn the first day of term Omari wheeled himself up the new ramp. "He told everyone it was his ramp," Amina laughs. Three other children now use it too.\n\nIllustrative story created for the demo environment.',
   'published', 'approved', true, timezone('utc', now()) - interval '22 days', 'en', 'A ramp, a classroom, a first day', 'How a caregiver''s advocacy got a ramp built at a primary school in Mtwapa.', 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '23 days'),
  ('d2000000-0000-4000-8000-000000000003', 'saturday-circle-in-kitengela', 'Saturday circle in Kitengela',
   'Every second Saturday, mothers of autistic children in Kajiado meet over chai to share what works—and what does not.',
   E'Naserian started the circle with three other mothers who met in a hospital queue. Now 14 women come, some walking an hour with their children.\n\nThey trade practical tips: visual timetables drawn on cardboard, quiet corners, how to explain autism to a grandmother. A physiotherapist visits once a month. The rest of the time, the women lead.\n\n"Before, I thought I was the only one," one mother says. "Now I have a whole group on my phone."\n\nIllustrative story created for the demo environment.',
   'published', 'approved', true, timezone('utc', now()) - interval '9 days', 'en', 'Saturday circle in Kitengela', 'A peer circle for mothers of autistic children in Kajiado.', 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '10 days'),
  ('d2000000-0000-4000-8000-000000000004', 'tana-river-boat-clinic', 'The boat clinic on the Tana',
   'Draft: a mobile assessment day for families along the Tana River.',
   E'Draft story awaiting consent confirmation from two families.',
   'draft', 'pending_review', false, null, 'en', null, null, 'd1000000-0000-4000-8000-000000000006', null, null)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- News, resources, reports
-- -----------------------------------------------------------------------------
insert into public.content_items (id, content_type, slug, title, excerpt, body, status, review_status, default_language, published_at, report_year, report_category, evidence_label, created_by, reviewed_by, reviewed_at)
values
  ('d3000000-0000-4000-8000-000000000001', 'news', 'back-to-school-2027-appeal', 'Back to school 2027: our school fees appeal is open',
   'One hundred children with disabilities and vulnerable children deserve to start January with fees paid and books in hand.',
   E'Every January, families we work with face the same choice: pay school fees or pay for therapy, food, and transport. Too often, the child with a disability is the one who stays home.\n\nOur Back to school 2027 appeal aims to keep 100 children in class. Gifts cover fees paid directly to schools, uniforms, shoes, and learning materials chosen with each child''s teacher.\n\nYou can give by M-Pesa or bank transfer on our donate page.',
   'published', 'approved', 'en', timezone('utc', now()) - interval '6 days', null, null, null, 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '6 days'),
  ('d3000000-0000-4000-8000-000000000002', 'news', 'likoni-home-care-course-graduates', 'Twelve caregivers complete home-care skills course in Likoni',
   'Positioning, feeding, safe lifting, and looking after yourself: twelve mothers graduated after eight weeks.',
   E'Twelve caregivers in Likoni completed our eight-week home-care skills course this month. Sessions covered positioning and seating, safe feeding, lifting without injury, and caring for your own health.\n\nThe course was co-delivered with a volunteer physiotherapist and the Pwani Inclusive Therapy Collective. Graduates will help lead the next intake.',
   'published', 'approved', 'en', timezone('utc', now()) - interval '18 days', null, null, null, 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '18 days'),
  ('d3000000-0000-4000-8000-000000000003', 'news', 'kadzo-weavers-join-the-shop', 'Kadzo Weavers join our online shop',
   'Kiondo baskets and sisal coasters from a caregivers'' group in Kilifi are now available to order.',
   E'Kadzo Weavers, a group of eight caregivers in Kilifi, now sell through our online shop. Each basket takes about three days to weave. Prices were agreed by the group, and every sale is recorded so makers can see their earnings.',
   'published', 'approved', 'en', timezone('utc', now()) - interval '33 days', null, null, null, 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '33 days'),
  ('d3000000-0000-4000-8000-000000000011', 'resource', 'getting-an-ncpwd-disability-card', 'Getting a disability card: a step-by-step guide',
   'Registering with the National Council for Persons with Disabilities can open doors to support. Here is how families usually go about it.',
   E'1. Book a disability assessment at a government hospital in your county. Bring the child''s birth certificate or notification and any medical records.\n2. A medical officer completes the assessment form.\n3. Submit the form and copies of your documents to the NCPWD county office or through the official online service.\n4. Keep your registration number and collect the card when you are notified.\n\nRequirements can change. Check with NCPWD or ask our team to walk through it with you.',
   'published', 'approved', 'en', timezone('utc', now()) - interval '50 days', null, null, null, 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '50 days'),
  ('d3000000-0000-4000-8000-000000000012', 'resource', 'mwongozo-wa-kujitunza-kwa-walezi', 'Mwongozo wa kujitunza kwa walezi',
   'Kumlea mtoto mwenye ulemavu ni kazi kubwa. Mwongozo huu mfupi unakusaidia kujitunza pia.',
   E'Pumzika unapoweza, hata dakika kumi.\nZungumza na mlezi mwingine unayemwamini.\nKula vizuri na kunywa maji ya kutosha.\nOmba msaada mapema—si dalili ya udhaifu.\nUkihisi huzuni kwa muda mrefu, zungumza na mhudumu wa afya.',
   'published', 'approved', 'sw', timezone('utc', now()) - interval '45 days', null, null, null, 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '45 days'),
  ('d3000000-0000-4000-8000-000000000013', 'resource', 'preparing-for-an-educational-assessment', 'Preparing for an educational assessment',
   'Educational assessment centres help decide the right school placement and support for your child. A little preparation helps.',
   E'Write down what your child enjoys, finds hard, and how they communicate.\nBring any medical reports and previous school reports.\nAsk what support the school can offer: seating, a ramp, an assistant, or a special unit.\nYou can bring someone with you. Ask questions until you understand the recommendation.',
   'published', 'approved', 'en', timezone('utc', now()) - interval '30 days', null, null, null, 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '30 days'),
  ('d3000000-0000-4000-8000-000000000021', 'report', 'annual-report-2025', 'Annual report 2025',
   'Our first year: circles started in three counties, the first makers trained, and the lessons we learned.',
   E'This demo annual report summarises the foundation''s first year of activity: where we worked, who we served, what it cost, and what we would do differently.\n\nIllustrative report created for the demo environment.',
   'published', 'approved', 'en', timezone('utc', now()) - interval '200 days', 2025, 'annual', 'Board-approved · demo document', 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '200 days'),
  ('d3000000-0000-4000-8000-000000000022', 'report', 'financial-statements-2025', 'Financial statements 2025',
   'Income, expenditure, and the share of every shilling spent on programmes.',
   E'Summary financial statements for the year ended 31 December 2025.\n\nIllustrative report created for the demo environment.',
   'published', 'approved', 'en', timezone('utc', now()) - interval '190 days', 2025, 'financial', 'Audited · demo document', 'd1000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '190 days'),
  ('d3000000-0000-4000-8000-000000000031', 'news', 'idpd-2026-walk-announcement', 'Draft: join our walk on the International Day of Persons with Disabilities',
   'Draft news item awaiting review.', E'Details to be confirmed with the county.',
   'draft', 'pending_review', 'en', null, null, null, null, 'd1000000-0000-4000-8000-000000000006', null, null)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Events, registrations, attendance
-- -----------------------------------------------------------------------------
insert into public.engagement_events (id, slug, title, summary, description, starts_at, ends_at, location, capacity, status, registration_deadline)
values
  ('d4000000-0000-4000-8000-000000000001', 'caregiver-circle-likoni', 'Caregiver circle: Likoni',
   'Chai, a practical skill, and two hours that are just for you.',
   E'This month: safe lifting and positioning with a volunteer physiotherapist.\nChildren are welcome—our volunteers run a play corner.',
   date_trunc('day', timezone('utc', now())) + interval '9 days 6 hours', date_trunc('day', timezone('utc', now())) + interval '9 days 9 hours',
   'Likoni, Mombasa · community hall shared after registration', 30, 'published', date_trunc('day', timezone('utc', now())) + interval '8 days 15 hours'),
  ('d4000000-0000-4000-8000-000000000002', 'studio-pricing-your-work', 'Maker studio: pricing your work',
   'For weavers and beadworkers: how to price fairly, record sales, and plan for busy seasons.',
   E'A hands-on session with Kadzo Weavers. Bring a product and your record book if you have one.',
   date_trunc('day', timezone('utc', now())) + interval '16 days 7 hours', date_trunc('day', timezone('utc', now())) + interval '16 days 10 hours',
   'Mtwapa, Kilifi', 20, 'published', date_trunc('day', timezone('utc', now())) + interval '15 days 15 hours'),
  ('d4000000-0000-4000-8000-000000000003', 'idpd-community-walk', 'International Day of Persons with Disabilities: community walk',
   'Walk, wheel, or roll with us along Mama Ngina Drive.',
   E'A family-friendly walk to celebrate the International Day of Persons with Disabilities. Accessible route, water stations, and a shaded rest point.',
   case when make_date(extract(year from now())::int, 12, 3) > now() then make_date(extract(year from now())::int, 12, 3) else make_date(extract(year from now())::int + 1, 12, 3) end + time '06:00',
   case when make_date(extract(year from now())::int, 12, 3) > now() then make_date(extract(year from now())::int, 12, 3) else make_date(extract(year from now())::int + 1, 12, 3) end + time '09:00',
   'Mama Ngina Drive, Mombasa', 200, 'published', null),
  ('d4000000-0000-4000-8000-000000000004', 'inclusive-classrooms-ukunda', 'Inclusive classrooms forum for teachers',
   'Practical adjustments for learners with disabilities, shared by teachers who have made them work.',
   E'For head teachers and teachers in Kwale. Certificates of attendance provided.',
   date_trunc('day', timezone('utc', now())) + interval '30 days 6 hours', date_trunc('day', timezone('utc', now())) + interval '30 days 11 hours',
   'Ukunda, Kwale', 60, 'published', date_trunc('day', timezone('utc', now())) + interval '27 days'),
  ('d4000000-0000-4000-8000-000000000005', 'kitengela-saturday-circle', 'Saturday circle: Kitengela',
   'A peer circle for mothers of autistic children in Kajiado.',
   E'Visual timetables this month. Bring cardboard and markers if you can; we will have spares.',
   date_trunc('day', timezone('utc', now())) + interval '12 days 7 hours', date_trunc('day', timezone('utc', now())) + interval '12 days 10 hours',
   'Kitengela, Kajiado', 2, 'published', date_trunc('day', timezone('utc', now())) + interval '11 days'),
  ('d4000000-0000-4000-8000-000000000006', 'caregiver-circle-kilifi-past', 'Caregiver circle: Kilifi town',
   'Feeding and nutrition for children with cerebral palsy.',
   E'A past circle kept for attendance records.',
   date_trunc('day', timezone('utc', now())) - interval '20 days' + interval '6 hours', date_trunc('day', timezone('utc', now())) - interval '20 days' + interval '9 hours',
   'Kilifi town', 25, 'published', date_trunc('day', timezone('utc', now())) - interval '21 days')
on conflict (id) do nothing;

insert into public.event_registrations (id, event_id, user_id, name, email, status, created_at)
values
  ('d4100000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000010', 'Mwanajuma Hamisi', 'caregiver@demo.wellknit.test', 'registered', timezone('utc', now()) - interval '2 days'),
  ('d4100000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000001', null, 'Rukia Mohamed', 'rukia.m@example.org', 'registered', timezone('utc', now()) - interval '3 days'),
  ('d4100000-0000-4000-8000-000000000003', 'd4000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000007', 'Ruth Kamau', 'donor@demo.wellknit.test', 'registered', timezone('utc', now()) - interval '1 day'),
  ('d4100000-0000-4000-8000-000000000004', 'd4000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000009', 'Brian Kiprono', 'volunteer@demo.wellknit.test', 'registered', timezone('utc', now()) - interval '1 day'),
  ('d4100000-0000-4000-8000-000000000005', 'd4000000-0000-4000-8000-000000000005', null, 'Naserian Sankale', 'naserian.s@example.org', 'registered', timezone('utc', now()) - interval '4 days'),
  ('d4100000-0000-4000-8000-000000000006', 'd4000000-0000-4000-8000-000000000005', null, 'Esther Nkoitoi', 'esther.n@example.org', 'registered', timezone('utc', now()) - interval '4 days'),
  ('d4100000-0000-4000-8000-000000000007', 'd4000000-0000-4000-8000-000000000005', null, 'Mary Sein', 'mary.sein@example.org', 'waitlisted', timezone('utc', now()) - interval '2 days'),
  ('d4100000-0000-4000-8000-000000000008', 'd4000000-0000-4000-8000-000000000006', null, 'Kadzo Mwangome', 'kadzo.w@example.org', 'registered', timezone('utc', now()) - interval '26 days'),
  ('d4100000-0000-4000-8000-000000000009', 'd4000000-0000-4000-8000-000000000006', null, 'Dama Charo', 'dama.c@example.org', 'registered', timezone('utc', now()) - interval '25 days'),
  ('d4100000-0000-4000-8000-000000000010', 'd4000000-0000-4000-8000-000000000006', null, 'Sidi Katana', 'sidi.k@example.org', 'registered', timezone('utc', now()) - interval '24 days')
on conflict (id) do nothing;

insert into public.event_attendance (registration_id, attendance_status, checked_in_at, notes, marked_by)
values
  ('d4100000-0000-4000-8000-000000000008', 'attended', timezone('utc', now()) - interval '20 days', 'Brought two neighbours.', 'd1000000-0000-4000-8000-000000000003'),
  ('d4100000-0000-4000-8000-000000000009', 'attended', timezone('utc', now()) - interval '20 days', '', 'd1000000-0000-4000-8000-000000000003'),
  ('d4100000-0000-4000-8000-000000000010', 'no_show', null, 'Child unwell; follow up by phone.', 'd1000000-0000-4000-8000-000000000003')
on conflict (registration_id) do nothing;

-- -----------------------------------------------------------------------------
-- Partners and volunteers
-- -----------------------------------------------------------------------------
insert into public.partner_applications (id, applicant_id, organization_name, contact_name, contact_email, focus_area, counties, notes, consent_recorded, status, created_at)
values
  ('db000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000008', 'Pwani Inclusive Therapy Collective', 'Fatma Said', 'partner@demo.wellknit.test', 'Care and support', array['Mombasa', 'Kilifi', 'Kwale'],
   'Physiotherapists and occupational therapists offering home visits and seating assessments. We would like to take referrals from caregiver circles.', true, 'approved', timezone('utc', now()) - interval '140 days'),
  ('db000000-0000-4000-8000-000000000002', null, 'Shimba Hills Women''s Savings Network', 'Mwanaisha Juma', 'mwanaisha.j@example.org', 'Economic opportunity', array['Kwale'],
   'Thirty savings groups in Kwale. We would like to include caregivers of children with disabilities and adapt meeting times.', true, 'in_review', timezone('utc', now()) - interval '12 days'),
  ('db000000-0000-4000-8000-000000000003', null, 'Kitengela Parents of Special Learners', 'Joseph Lekishon', 'joseph.l@example.org', 'Inclusion and accessibility', array['Kajiado'],
   'A parents'' association at two special units. Interested in the Saturday circle model and advocacy training.', true, 'pending', timezone('utc', now()) - interval '3 days')
on conflict (id) do nothing;

insert into public.partner_due_diligence (partner_application_id, verification_status, checks, notes, reviewed_by, reviewed_at)
values
  ('db000000-0000-4000-8000-000000000001', 'cleared', '{"registration":true,"safeguarding_policy":true,"references":true,"data_sharing_agreement":true}', 'Registration and practising licences checked. Safeguarding policy reviewed.', 'd1000000-0000-4000-8000-000000000003', timezone('utc', now()) - interval '120 days'),
  ('db000000-0000-4000-8000-000000000002', 'in_review', '{"registration":true,"safeguarding_policy":false}', 'Awaiting safeguarding policy.', 'd1000000-0000-4000-8000-000000000003', timezone('utc', now()) - interval '5 days')
on conflict (partner_application_id) do nothing;

insert into public.partner_memberships (partner_application_id, user_id, membership_status, created_by)
values ('db000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000008', 'active', 'd1000000-0000-4000-8000-000000000002')
on conflict (partner_application_id, user_id) do nothing;

insert into public.partner_program_assignments (partner_application_id, program_id, assignment_status, assigned_by)
select 'db000000-0000-4000-8000-000000000001', id, 'active', 'd1000000-0000-4000-8000-000000000003'
from public.programs where slug in ('caregiver-support', 'education-advocacy')
on conflict (partner_application_id, program_id) do nothing;

insert into public.volunteer_applications (id, applicant_id, name, email, county, skills, availability, consent_recorded, status, created_at)
values
  ('dc000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000009', 'Brian Kiprono', 'volunteer@demo.wellknit.test', 'Mombasa', 'Final-year physiotherapy student. Positioning, exercise programmes, and making simple seating aids.', 'Two Saturdays a month', true, 'approved', timezone('utc', now()) - interval '90 days'),
  ('dc000000-0000-4000-8000-000000000002', null, 'Halima Abdalla', 'halima.a@example.org', 'Mombasa', 'Kenyan Sign Language interpreter. Happy to interpret at circles and events.', 'Weekday evenings and some Saturdays', true, 'in_review', timezone('utc', now()) - interval '8 days'),
  ('dc000000-0000-4000-8000-000000000003', null, 'Peter Njoroge', 'peter.n@example.org', 'Kajiado', 'Accountant. Could help maker groups keep simple records and prepare for the shop.', 'One evening a week, online', true, 'pending', timezone('utc', now()) - interval '2 days'),
  ('dc000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000007', 'Ruth Kamau', 'donor@demo.wellknit.test', 'Nairobi', 'Marketing and photography. Could help makers photograph products (with consent).', 'Remote, a few hours a month', true, 'approved', timezone('utc', now()) - interval '60 days')
on conflict (id) do nothing;

insert into public.volunteer_assignments (volunteer_application_id, program_id, assignment_status, notes, assigned_by)
select assignment.application_id::uuid, programs.id, assignment.status, assignment.notes, 'd1000000-0000-4000-8000-000000000003'
from (values
  ('dc000000-0000-4000-8000-000000000001', 'caregiver-support', 'active', 'Supports Likoni circles: positioning and home exercise demonstrations.'),
  ('dc000000-0000-4000-8000-000000000004', 'skills-livelihoods', 'active', 'Product photography sessions with Kadzo Weavers.')
) as assignment(application_id, slug, status, notes)
join public.programs on programs.slug = assignment.slug
where not exists (select 1 from public.volunteer_assignments existing where existing.volunteer_application_id = assignment.application_id::uuid and existing.program_id = programs.id);

insert into public.engagement_notifications (id, audience_type, audience_key, title, body, status, created_by, sent_at)
values
  ('dd200000-0000-4000-8000-000000000001', 'all', null, 'Back to school 2027 appeal is live', 'Our appeal to keep 100 children in school this January is open. Share it with someone who cares.', 'sent', 'd1000000-0000-4000-8000-000000000002', timezone('utc', now()) - interval '6 days'),
  ('dd200000-0000-4000-8000-000000000002', 'role', 'partner', 'Referral responses within five working days', 'A reminder to update each referral within five working days so caregivers know what happens next.', 'sent', 'd1000000-0000-4000-8000-000000000003', timezone('utc', now()) - interval '4 days'),
  ('dd200000-0000-4000-8000-000000000003', 'role', 'volunteer', 'Volunteer induction this Saturday', 'New and returning volunteers: safeguarding induction at the Nyali office, 9:00 to 11:00. Tea provided.', 'sent', 'd1000000-0000-4000-8000-000000000003', timezone('utc', now()) - interval '2 days')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Support cases (fictional)
-- -----------------------------------------------------------------------------
insert into public.support_requests (id, requester_id, beneficiary_group, county, subject, description, status, confidential, assigned_to, contact_name, contact_email, contact_phone, preferred_contact_method, preferred_contact_window, need_category, urgency, consent_to_contact, safeguarding_concern, safeguarding_flag, safeguarding_summary, follow_up_at, closure_reason, submission_channel, created_at)
values
  ('da000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000010', 'caregiver_disability', 'Mombasa', 'Support request: Disability support or equipment',
   'My son Juma is 9 and has cerebral palsy. His wheelchair is too small and the wheel is broken. I carry him to school and my back is hurting.',
   'in_progress', true, 'd1000000-0000-4000-8000-000000000003', 'Mwanajuma Hamisi', 'caregiver@demo.wellknit.test', '+254 700 100 010', 'whatsapp', 'Mornings before 10', 'disability_support', 'high', true, false, false, null,
   timezone('utc', now()) + interval '3 days', null, 'account', timezone('utc', now()) - interval '18 days'),
  ('da000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000010', 'caregiver_disability', 'Mombasa', 'Support request: School fees or learning',
   'Juma''s school fees for next term are due in January. I sell vegetables but this season was slow.',
   'new', true, null, 'Mwanajuma Hamisi', 'caregiver@demo.wellknit.test', '+254 700 100 010', 'phone', 'Afternoons', 'education', 'normal', true, false, false, null,
   null, null, 'account', timezone('utc', now()) - interval '2 days'),
  ('da000000-0000-4000-8000-000000000003', null, 'orphan_vulnerable_child', 'Kwale', 'Support request: Safety or protection',
   'A girl about 7 years old in our village is often left alone for days and is not going to school. Neighbours are feeding her.',
   'referred', true, 'd1000000-0000-4000-8000-000000000003', null, null, null, 'none', null, 'protection', 'urgent', false, true, true, 'Possible neglect of a child. Referred to the Department of Children''s Services the same day.',
   timezone('utc', now()) + interval '1 day', null, 'web', timezone('utc', now()) - interval '6 days'),
  ('da000000-0000-4000-8000-000000000004', null, 'economically_vulnerable_woman', 'Kilifi', 'Support request: Income or skills training',
   'I care for my mother who had a stroke and my two children. I can sew and want to learn to make school uniforms to sell.',
   'in_review', true, null, 'Dama Charo', null, '+254 700 200 004', 'whatsapp', 'Evenings', 'livelihood', 'normal', true, false, false, null,
   timezone('utc', now()) + interval '5 days', null, 'web', timezone('utc', now()) - interval '4 days'),
  ('da000000-0000-4000-8000-000000000005', null, 'caregiver_disability', 'Kajiado', 'Support request: Caregiving support',
   'Mother of an autistic boy, 5. Looking for other parents nearby and advice on routines.',
   'resolved', true, 'd1000000-0000-4000-8000-000000000003', 'Esther Nkoitoi', 'esther.n@example.org', null, 'email', null, 'caregiving', 'low', true, false, false, null,
   null, 'Joined the Kitengela Saturday circle.', 'web', timezone('utc', now()) - interval '40 days'),
  ('da000000-0000-4000-8000-000000000006', null, 'person_with_disability', 'Tana River', 'Support request: Documents or referral',
   'Young man, 19, deaf, wants a disability card to apply for a tailoring course bursary. Family called the office.',
   'referred', true, 'd1000000-0000-4000-8000-000000000003', 'Abdi Galgalo (uncle)', null, '+254 700 200 006', 'sms', 'Any time', 'documentation', 'normal', true, false, false, null,
   timezone('utc', now()) + interval '10 days', null, 'assisted', timezone('utc', now()) - interval '14 days'),
  ('da000000-0000-4000-8000-000000000007', null, 'caregiver_vulnerable_group', 'Mombasa', 'Support request: Health or wellbeing',
   'Caring for my grandson and my husband who is living with HIV. I am tired and need someone to talk to.',
   'closed', true, 'd1000000-0000-4000-8000-000000000003', 'Bi Mwanahawa', null, '+254 700 200 007', 'phone', 'Mornings', 'health', 'normal', true, false, false, null,
   null, 'Connected to a community health promoter and a caregivers'' circle.', 'web', timezone('utc', now()) - interval '75 days'),
  ('da000000-0000-4000-8000-000000000008', null, 'caregiver_disability', 'Kwale', 'Support request: Caregiving support',
   'My daughter is 4 and cannot sit without support. The clinic said she needs exercises at home but nobody showed me how.',
   'referred', true, 'd1000000-0000-4000-8000-000000000003', 'Mama Tumaini', null, '+254 700 200 008', 'phone', 'Weekday mornings', 'caregiving', 'high', true, false, false, null,
   timezone('utc', now()) + interval '2 days', null, 'web', timezone('utc', now()) - interval '3 days')
on conflict (id) do nothing;

insert into public.support_request_notes (support_request_id, author_id, note, is_internal, created_at)
select note.request_id::uuid, 'd1000000-0000-4000-8000-000000000003', note.body, true, timezone('utc', now()) - note.age::interval
from (values
  ('da000000-0000-4000-8000-000000000001', 'Called on WhatsApp. Juma needs a seating assessment before a new chair is ordered. Referred to Pwani Inclusive Therapy.', '17 days'),
  ('da000000-0000-4000-8000-000000000001', 'Assessment done at home. Chair with lateral supports quoted at KES 38,000. Approved from the assistive devices budget.', '9 days'),
  ('da000000-0000-4000-8000-000000000003', 'Called Children''s Services. Officer will visit within 48 hours. Neighbour contact kept off the record at their request.', '6 days'),
  ('da000000-0000-4000-8000-000000000006', 'Explained the assessment process to the uncle by SMS. Referred to the county assessment clinic.', '13 days')
) as note(request_id, body, age)
where not exists (select 1 from public.support_request_notes existing where existing.support_request_id = note.request_id::uuid and existing.note = note.body);

insert into public.support_referrals (support_request_id, partner_name, partner_contact, referral_status, referred_at, response_due_at, outcome, created_by, partner_application_id)
select referral.request_id::uuid, referral.partner, referral.contact, referral.status, timezone('utc', now()) - referral.age::interval, timezone('utc', now()) + referral.due::interval, referral.outcome, 'd1000000-0000-4000-8000-000000000003', referral.partner_id::uuid
from (values
  ('da000000-0000-4000-8000-000000000001', 'Pwani Inclusive Therapy Collective', 'Home visits team', 'completed', '17 days', '-10 days', 'Seating assessment completed; chair specification sent.', 'db000000-0000-4000-8000-000000000001'),
  ('da000000-0000-4000-8000-000000000003', 'Department of Children''s Services, Kwale', 'Children''s officer on duty', 'accepted', '6 days', '2 days', null, null),
  ('da000000-0000-4000-8000-000000000006', 'County disability assessment clinic', 'Front desk', 'pending', '13 days', '1 day', null, null),
  ('da000000-0000-4000-8000-000000000008', 'Pwani Inclusive Therapy Collective', 'Home visits team', 'pending', '2 days', '3 days', null, 'db000000-0000-4000-8000-000000000001')
) as referral(request_id, partner, contact, status, age, due, outcome, partner_id)
where not exists (select 1 from public.support_referrals existing where existing.support_request_id = referral.request_id::uuid and existing.partner_name = referral.partner);

insert into public.support_export_requests (requested_by, status, reason, filters)
select 'd1000000-0000-4000-8000-000000000003', 'pending', 'Quarterly anonymised summary for the board: counts by county, need, and outcome only.', '{"period":"2026-Q3","fields":["county","need_category","status"]}'
where not exists (select 1 from public.support_export_requests where requested_by = 'd1000000-0000-4000-8000-000000000003');

-- -----------------------------------------------------------------------------
-- Fundraising: campaigns and gifts
-- -----------------------------------------------------------------------------
insert into public.fundraising_campaigns (id, slug, title, summary, goal_amount, currency, status, starts_at, ends_at, created_by, created_at)
values
  ('d5000000-0000-4000-8000-000000000001', 'back-to-school-2027', 'Back to school 2027: 100 children, 100 futures',
   'In January, 100 children with disabilities and vulnerable children deserve to start the school year with fees paid, uniforms on, and the right learning materials.',
   750000, 'KES', 'active', timezone('utc', now()) - interval '6 days', make_date(extract(year from now())::int + 1, 1, 31), 'd1000000-0000-4000-8000-000000000004', timezone('utc', now()) - interval '7 days'),
  ('d5000000-0000-4000-8000-000000000002', 'wheels-to-learn-2026', 'Wheels to learn 2026',
   'Wheelchairs and seating fitted by a physiotherapist, so children can sit comfortably and get to class.',
   400000, 'KES', 'closed', timezone('utc', now()) - interval '200 days', timezone('utc', now()) - interval '60 days', 'd1000000-0000-4000-8000-000000000004', timezone('utc', now()) - interval '201 days')
on conflict (id) do nothing;

insert into public.donations (id, donor_id, campaign_id, amount, currency, status, donor_name, donor_email, receipt_email, is_anonymous, recurring, consent_to_updates, idempotency_key, created_at)
values
  ('d6001000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000007', 'd5000000-0000-4000-8000-000000000001', 10000, 'KES', 'pending', 'Ruth Kamau', 'donor@demo.wellknit.test', 'donor@demo.wellknit.test', false, false, true, 'demo-seed-gift-0001', timezone('utc', now()) - interval '5 days'),
  ('d6002000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000007', 'd5000000-0000-4000-8000-000000000002', 25000, 'KES', 'pending', 'Ruth Kamau', 'donor@demo.wellknit.test', 'donor@demo.wellknit.test', false, false, true, 'demo-seed-gift-0002', timezone('utc', now()) - interval '150 days'),
  ('d6003000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000007', 'd5000000-0000-4000-8000-000000000002', 5000, 'KES', 'pending', 'Ruth Kamau', 'donor@demo.wellknit.test', 'donor@demo.wellknit.test', false, false, true, 'demo-seed-gift-0003', timezone('utc', now()) - interval '95 days'),
  ('d6004000-0000-4000-8000-000000000004', null, 'd5000000-0000-4000-8000-000000000001', 50000, 'KES', 'pending', 'Coast Rotary Friends', 'giving@example.org', 'giving@example.org', false, false, false, 'demo-seed-gift-0004', timezone('utc', now()) - interval '4 days'),
  ('d6005000-0000-4000-8000-000000000005', null, 'd5000000-0000-4000-8000-000000000001', 2500, 'KES', 'pending', null, null, null, true, false, false, 'demo-seed-gift-0005', timezone('utc', now()) - interval '4 days'),
  ('d6006000-0000-4000-8000-000000000006', null, 'd5000000-0000-4000-8000-000000000001', 1000, 'KES', 'pending', 'Hassan Omar', 'hassan.o@example.org', 'hassan.o@example.org', false, false, true, 'demo-seed-gift-0006', timezone('utc', now()) - interval '3 days'),
  ('d6007000-0000-4000-8000-000000000007', null, 'd5000000-0000-4000-8000-000000000001', 15000, 'KES', 'pending', 'The Mwakio family', 'mwakio.family@example.org', 'mwakio.family@example.org', false, false, true, 'demo-seed-gift-0007', timezone('utc', now()) - interval '3 days'),
  ('d6008000-0000-4000-8000-000000000008', null, 'd5000000-0000-4000-8000-000000000001', 500, 'KES', 'pending', null, null, null, true, false, false, 'demo-seed-gift-0008', timezone('utc', now()) - interval '2 days'),
  ('d6009000-0000-4000-8000-000000000009', null, 'd5000000-0000-4000-8000-000000000001', 7500, 'KES', 'pending', 'Grace & Tom (UK)', 'graceandtom@example.org', 'graceandtom@example.org', false, false, true, 'demo-seed-gift-0009', timezone('utc', now()) - interval '1 day'),
  ('d6010000-0000-4000-8000-000000000010', null, 'd5000000-0000-4000-8000-000000000002', 300000, 'KES', 'pending', 'A Mombasa family foundation', 'trust@example.org', 'trust@example.org', false, false, false, 'demo-seed-gift-0010', timezone('utc', now()) - interval '120 days'),
  ('d6011000-0000-4000-8000-000000000011', null, 'd5000000-0000-4000-8000-000000000002', 85000, 'KES', 'pending', 'Staff of a Nyali hotel', 'staff.giving@example.org', 'staff.giving@example.org', false, false, false, 'demo-seed-gift-0011', timezone('utc', now()) - interval '100 days'),
  ('d6012000-0000-4000-8000-000000000012', null, 'd5000000-0000-4000-8000-000000000001', 3000, 'KES', 'pending', 'Wanjiku N.', 'wanjiku.n@example.org', 'wanjiku.n@example.org', false, false, true, 'demo-seed-gift-0012', timezone('utc', now()) - interval '20 minutes'),
  ('d6013000-0000-4000-8000-000000000013', null, 'd5000000-0000-4000-8000-000000000001', 2000, 'KES', 'pending', 'Otieno J.', 'otieno.j@example.org', 'otieno.j@example.org', false, false, false, 'demo-seed-gift-0013', timezone('utc', now()) - interval '2 days')
on conflict (id) do nothing;

-- Mark gifts as paid through M-Pesa so receipt and campaign-total triggers run.
update public.donations as gift
set status = 'succeeded', provider = 'mpesa', provider_reference = reference.code, reconciled_at = gift.created_at + interval '2 minutes'
from (values
  ('d6001000-0000-4000-8000-000000000001', 'SKB4R7T2QA'), ('d6002000-0000-4000-8000-000000000002', 'RGH2M9X1LC'), ('d6003000-0000-4000-8000-000000000003', 'RHK8D3P5NW'),
  ('d6004000-0000-4000-8000-000000000004', 'SKA1Z6V8JD'), ('d6005000-0000-4000-8000-000000000005', 'SKA7Q2N4TU'), ('d6006000-0000-4000-8000-000000000006', 'SKC3W5E9RB'),
  ('d6007000-0000-4000-8000-000000000007', 'SKC9L1H6PM'), ('d6008000-0000-4000-8000-000000000008', 'SKD2F8K3XY'), ('d6009000-0000-4000-8000-000000000009', 'SKE5T7B1GQ'),
  ('d6010000-0000-4000-8000-000000000010', 'RJM4S2C8VA'), ('d6011000-0000-4000-8000-000000000011', 'RKN6Y9D2HE')
) as reference(id, code)
where gift.id = reference.id::uuid and gift.status = 'pending';

update public.donations set status = 'failed', provider = 'mpesa', failure_reason = 'Request cancelled by user', reconciled_at = created_at + interval '1 minute'
where id = 'd6013000-0000-4000-8000-000000000013' and status = 'pending';

-- -----------------------------------------------------------------------------
-- Marketplace: makers, products, orders
-- -----------------------------------------------------------------------------
insert into public.maker_profiles (id, display_name, story, county, status, consent_recorded)
values
  ('d8000000-0000-4000-8000-000000000001', 'Kadzo Weavers', 'Eight caregivers in Kilifi weaving kiondo baskets and sisal homeware while their children play nearby.', 'Kilifi', 'approved', true),
  ('d8000000-0000-4000-8000-000000000002', 'Naserian Beadwork Circle', 'Mothers of autistic children in Kitengela who bead between Saturday circles.', 'Kajiado', 'approved', true),
  ('d8000000-0000-4000-8000-000000000003', 'Likoni Kikoi Makers', 'A tailoring group of caregivers in Likoni who cut and finish kikoi throws and bags.', 'Mombasa', 'approved', true)
on conflict (id) do nothing;

insert into public.products (id, slug, name, description, short_description, maker_story, impact_note, price, currency, stock_quantity, reserved_quantity, status, category_slug, featured, maker_profile_record_id, image_url, image_credit, created_by)
values
  ('d7000000-0000-4000-8000-000000000001', 'kiondo-market-basket', 'Kiondo market basket', 'A sturdy, hand-woven sisal kiondo with leather-wrapped handles. Each basket takes about three days to weave and no two are the same.', 'Hand-woven sisal, made for market days and beach days.', 'Woven by Kadzo Weavers in Kilifi.', 'About two-thirds of the price goes straight to the weaver.', 2800, 'KES', 14, 0, 'active', 'home', true, 'd8000000-0000-4000-8000-000000000001', '/demo/products/kiondo-basket.svg', 'Illustration · demo catalogue', 'd1000000-0000-4000-8000-000000000005'),
  ('d7000000-0000-4000-8000-000000000002', 'sisal-coaster-set', 'Sisal coasters, set of six', 'Coiled sisal coasters in earth and ocean tones. Heat-safe and wipe-clean.', 'Six coiled coasters for the table.', 'Woven by Kadzo Weavers in Kilifi.', 'A good first piece for new weavers in the group.', 950, 'KES', 30, 0, 'active', 'home', false, 'd8000000-0000-4000-8000-000000000001', '/demo/products/sisal-coasters.svg', 'Illustration · demo catalogue', 'd1000000-0000-4000-8000-000000000005'),
  ('d7000000-0000-4000-8000-000000000003', 'beaded-collar-necklace', 'Beaded collar necklace', 'A layered collar in red, white, blue, and gold glass beads, threaded on wire and finished with a hook clasp.', 'A statement collar in classic colours.', 'Beaded by the Naserian Beadwork Circle in Kitengela.', 'Each collar funds a month of the Saturday circle''s chai and materials.', 3500, 'KES', 6, 0, 'active', 'wearables', true, 'd8000000-0000-4000-8000-000000000002', '/demo/products/beaded-collar.svg', 'Illustration · demo catalogue', 'd1000000-0000-4000-8000-000000000005'),
  ('d7000000-0000-4000-8000-000000000004', 'friendship-bracelets', 'Friendship bracelets, set of three', 'Three stretch bracelets in glass seed beads. One to keep, two to give away.', 'Three bracelets, one for you and two to share.', 'Beaded by the Naserian Beadwork Circle in Kitengela.', 'Small pieces that children in the circle help sort and pack.', 750, 'KES', 40, 0, 'active', 'wearables', false, 'd8000000-0000-4000-8000-000000000002', '/demo/products/friendship-bracelets.svg', 'Illustration · demo catalogue', 'd1000000-0000-4000-8000-000000000005'),
  ('d7000000-0000-4000-8000-000000000005', 'kikoi-throw', 'Kikoi throw', 'A cotton kikoi throw with twisted fringe, hemmed by hand. Works as a throw, a picnic cloth, or a wrap.', 'Coastal cotton with a twisted fringe.', 'Finished by the Likoni Kikoi Makers.', 'Supports the group''s new uniform-tailoring line.', 2400, 'KES', 12, 0, 'active', 'home', false, 'd8000000-0000-4000-8000-000000000003', '/demo/products/kikoi-throw.svg', 'Illustration · demo catalogue', 'd1000000-0000-4000-8000-000000000005'),
  ('d7000000-0000-4000-8000-000000000006', 'circle-gift-hamper', 'The circle gift hamper', 'A kiondo filled with a kikoi, sisal coasters, and a set of bracelets. Gift-wrapped with a card about the makers.', 'Three groups, one gift.', 'A collaboration between all three maker groups.', 'Popular for corporate and end-of-year gifting.', 6500, 'KES', 8, 0, 'active', 'gifts', true, 'd8000000-0000-4000-8000-000000000001', '/demo/products/gift-hamper.svg', 'Illustration · demo catalogue', 'd1000000-0000-4000-8000-000000000005'),
  ('d7000000-0000-4000-8000-000000000007', 'mini-kiondo', 'Mini kiondo for children', 'A small kiondo sized for little hands.', 'Small enough for a school snack.', 'Woven by Kadzo Weavers in Kilifi.', 'The next batch is on the loom.', 1200, 'KES', 0, 0, 'active', 'gifts', false, 'd8000000-0000-4000-8000-000000000001', '/demo/products/mini-kiondo.svg', 'Illustration · demo catalogue', 'd1000000-0000-4000-8000-000000000005')
on conflict (id) do nothing;

insert into public.product_category_links (product_id, category_id)
select products.id, categories.id
from public.products
join public.product_categories categories on categories.slug = products.category_slug
where products.id::text like 'd7000000-%'
on conflict do nothing;

insert into public.orders (id, customer_id, customer_email, status, total_amount, currency, shipping_details, payment_reference, fulfilment_note, created_at)
values
  ('d9000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000007', 'donor@demo.wellknit.test', 'fulfilled', 3750, 'KES', '{"name":"Ruth Kamau","phone":"+254 700 100 007","county":"Nairobi","address":"Kilimani"}', 'SKF3P1R8WZ', 'Delivered by courier.', timezone('utc', now()) - interval '28 days'),
  ('d9000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000007', 'donor@demo.wellknit.test', 'processing', 6500, 'KES', '{"name":"Ruth Kamau","phone":"+254 700 100 007","county":"Nairobi","address":"Kilimani"}', 'SKG8N4T2LM', 'Hamper being assembled.', timezone('utc', now()) - interval '3 days'),
  ('d9000000-0000-4000-8000-000000000003', null, 'corporate.gifts@example.org', 'paid', 32500, 'KES', '{"name":"Corporate gifts desk","phone":"+254 700 300 003","county":"Mombasa","address":"Nyali"}', 'SKH2C6V9QA', 'Five hampers for end-of-year gifting.', timezone('utc', now()) - interval '1 day')
on conflict (id) do nothing;

insert into public.order_items (order_id, product_id, quantity, unit_price, product_name_snapshot, line_total)
select item.order_id::uuid, item.product_id::uuid, item.quantity, item.price, item.name, item.quantity * item.price
from (values
  ('d9000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000001', 1, 2800, 'Kiondo market basket'),
  ('d9000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000002', 1, 950, 'Sisal coasters, set of six'),
  ('d9000000-0000-4000-8000-000000000002', 'd7000000-0000-4000-8000-000000000006', 1, 6500, 'The circle gift hamper'),
  ('d9000000-0000-4000-8000-000000000003', 'd7000000-0000-4000-8000-000000000006', 5, 6500, 'The circle gift hamper')
) as item(order_id, product_id, quantity, price, name)
where not exists (select 1 from public.order_items existing where existing.order_id = item.order_id::uuid and existing.product_id = item.product_id::uuid);

-- -----------------------------------------------------------------------------
-- Illustrated covers (original artwork in public/demo/covers)
-- -----------------------------------------------------------------------------
update public.programs set image_path = '/demo/covers/program-' || slug || '.svg'
where slug in ('caregiver-support', 'skills-livelihoods', 'education-advocacy') and image_path is null;

update public.stories set image_path = cover.path
from (values
  ('d2000000-0000-4000-8000-000000000001', '/demo/covers/story-basket-to-business.svg'),
  ('d2000000-0000-4000-8000-000000000002', '/demo/covers/story-ramp-first-day.svg'),
  ('d2000000-0000-4000-8000-000000000003', '/demo/covers/story-saturday-circle.svg')
) as cover(id, path)
where stories.id = cover.id::uuid;

update public.content_items set image_path = cover.path
from (values
  ('d3000000-0000-4000-8000-000000000001', '/demo/covers/news-back-to-school.svg'),
  ('d3000000-0000-4000-8000-000000000002', '/demo/covers/news-home-care-graduates.svg'),
  ('d3000000-0000-4000-8000-000000000003', '/demo/covers/news-weavers-join-shop.svg')
) as cover(id, path)
where content_items.id = cover.id::uuid;

-- -----------------------------------------------------------------------------
-- Giving settings (demo values; Safaricom's public sandbox Paybill)
-- -----------------------------------------------------------------------------
update public.giving_settings
set mpesa_paybill = '174379', mpesa_account_reference = 'WKT-DEMO',
    bank_name = 'Demo Bank Kenya', bank_account_name = 'Well Knit Together Global Foundation', bank_account_number = '0100000000001', bank_branch = 'Nyali', bank_swift = 'DEMOKENA',
    giving_note = 'Demo environment: these payment details are not real.',
    updated_by = 'd1000000-0000-4000-8000-000000000001', updated_at = timezone('utc', now())
where id = true;

-- -----------------------------------------------------------------------------
-- Feedback, email activity, audit trail
-- -----------------------------------------------------------------------------
insert into public.site_feedback (area, rating, message, contact_email, consent_recorded, status, created_at)
select feedback.area, feedback.rating, feedback.message, feedback.email, true, feedback.status, timezone('utc', now()) - feedback.age::interval
from (values
  ('support', 5, 'The form in Kiswahili made it easy for my mother to ask for help herself.', null, 'reviewed', '12 days'),
  ('giving', 4, 'M-Pesa instructions were clear. Would love a receipt by SMS too.', 'hassan.o@example.org', 'new', '3 days'),
  ('marketplace', 3, 'Beautiful baskets. Delivery to Nairobi took a week; please show delivery times.', null, 'new', '1 day')
) as feedback(area, rating, message, email, status, age)
where not exists (select 1 from public.site_feedback existing where existing.message = feedback.message);

insert into public.email_messages (message_type, recipient_email, recipient_user_id, subject, dedupe_key, status, delivery_status, provider, provider_message_id, attempts, sent_at, created_at)
values
  ('donation_receipt', 'donor@demo.wellknit.test', 'd1000000-0000-4000-8000-000000000007', 'Thank you for your gift', 'demo:donation-receipt:d6001000-0000-4000-8000-000000000001', 'sent', 'delivered', 'resend', 'demo-msg-0001', 1, timezone('utc', now()) - interval '5 days', timezone('utc', now()) - interval '5 days'),
  ('support_request_received', 'esther.n@example.org', null, 'We received your support request', 'demo:support-received:da000000-0000-4000-8000-000000000005', 'sent', 'delivered', 'resend', 'demo-msg-0002', 1, timezone('utc', now()) - interval '40 days', timezone('utc', now()) - interval '40 days'),
  ('event_registration', 'naserian.s@example.org', null, 'You are registered: Saturday circle', 'demo:event-registration:d4100000-0000-4000-8000-000000000005', 'sent', 'bounced', 'resend', 'demo-msg-0003', 1, timezone('utc', now()) - interval '4 days', timezone('utc', now()) - interval '4 days'),
  ('volunteer_application_received', 'peter.n@example.org', null, 'We received your volunteer interest', 'demo:volunteer-received:dc000000-0000-4000-8000-000000000003', 'failed', 'failed', 'resend', null, 3, null, timezone('utc', now()) - interval '2 days')
on conflict (dedupe_key) do nothing;

insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
select log.actor::uuid, log.action, log.entity_type, log.entity_id::uuid, log.metadata::jsonb, timezone('utc', now()) - log.age::interval
from (values
  ('d1000000-0000-4000-8000-000000000001', 'giving_settings_updated', 'giving_settings', null, '{"fields":["mpesa_paybill","bank_account_number"]}', '30 days'),
  ('d1000000-0000-4000-8000-000000000002', 'staff_role_grant', 'user_role', null, '{"user_id":"d1000000-0000-4000-8000-000000000006","role":"content_editor"}', '150 days'),
  ('d1000000-0000-4000-8000-000000000003', 'engagement_application_status_changed', 'partner_applications', 'db000000-0000-4000-8000-000000000001', '{"status":"approved"}', '120 days')
) as log(actor, action, entity_type, entity_id, metadata, age)
where not exists (select 1 from public.audit_logs existing where existing.action = log.action and existing.actor_id = log.actor::uuid);

commit;
