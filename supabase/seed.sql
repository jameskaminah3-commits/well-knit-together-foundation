insert into public.programs (slug, title, summary, description, focus_groups, counties, status)
values
  ('caregiver-support', 'Caregiver support', 'Practical guidance, peer connection, referrals, and dignity-centred support.', 'A caregiver-first program area for support requests, referrals, peer connection, and service navigation.', array['caregiver_disability', 'caregiver_vulnerable_group']::public.beneficiary_group[], array['Mombasa', 'Kilifi', 'Tana River', 'Kwale', 'Kajiado'], 'published'),
  ('skills-livelihoods', 'Skills and livelihoods', 'Training, tools, market access, and economic pathways.', 'A livelihood program area for skills building, product development, market access, and income resilience.', array['economically_vulnerable_woman', 'person_with_disability']::public.beneficiary_group[], array['Mombasa', 'Kilifi', 'Kwale'], 'published'),
  ('education-advocacy', 'Education and advocacy', 'Learning support, information, and community advocacy.', 'An education and advocacy program area for learning support, information, and community inclusion.', array['orphan_vulnerable_child', 'wider_community']::public.beneficiary_group[], array['Mombasa', 'Kilifi', 'Tana River', 'Kwale', 'Kajiado'], 'published')
on conflict (slug) do nothing;

insert into public.indicator_dictionary (code, name, definition, unit, population_dimension, validation_rules)
values
  ('caregiver_learning_sessions', 'Caregiver learning sessions', 'Completed facilitated learning sessions recorded in the programme register.', 'sessions', 'all', '{"min":0,"whole_number":true}'),
  ('makers_supported', 'Makers supported', 'People receiving documented livelihood or market-readiness support during the reporting period.', 'people', 'economically_vulnerable_woman', '{"min":0,"whole_number":true}'),
  ('support_requests_resolved', 'Support requests resolved', 'Support requests closed with a documented resolution or referral outcome.', 'requests', 'all', '{"min":0,"whole_number":true}'),
  ('event_attendance_rate', 'Event attendance rate', 'Share of registered participants marked as attended for a published gathering.', 'percent', 'all', '{"min":0,"max":100}'),
  ('community_inclusion_score', 'Community inclusion score', 'Validated participant-reported inclusion score using the approved programme questionnaire.', 'score', 'wider_community', '{"min":0,"max":5}')
on conflict (code) do update set name = excluded.name, definition = excluded.definition, unit = excluded.unit, population_dimension = excluded.population_dimension, validation_rules = excluded.validation_rules;

insert into public.program_indicators (program_id, indicator_id, target, target_period, aggregation)
select program.id, dictionary.id, case dictionary.code when 'event_attendance_rate' then 80 else null end, '2026', case when dictionary.code = 'event_attendance_rate' then 'average' else 'sum' end
from public.programs program
cross join public.indicator_dictionary dictionary
where program.status = 'published' and dictionary.active = true
  and dictionary.code in ('caregiver_learning_sessions', 'makers_supported', 'support_requests_resolved', 'event_attendance_rate', 'community_inclusion_score')
on conflict (program_id, indicator_id) do nothing;

-- Demo records for local review. These are only created when an admin account
-- already exists, and every row uses deterministic ids so the seed is repeatable.
do $$
declare
  demo_admin uuid;
  caregiver_program uuid;
  livelihood_program uuid;
  caregiver_indicator uuid;
  makers_indicator uuid;
  resolved_indicator uuid;
  attendance_indicator uuid;
begin
  select users.id
  into demo_admin
  from auth.users users
  join public.user_roles roles on roles.user_id = users.id
  where roles.role = 'admin'
  order by users.created_at
  limit 1;

  if demo_admin is null then
    return;
  end if;

  select id into caregiver_program from public.programs where slug = 'caregiver-support';
  select id into livelihood_program from public.programs where slug = 'skills-livelihoods';
  select id into caregiver_indicator from public.program_indicators assignment
    join public.indicator_dictionary dictionary on dictionary.id = assignment.indicator_id
    where assignment.program_id = caregiver_program and dictionary.code = 'caregiver_learning_sessions';
  select id into makers_indicator from public.program_indicators assignment
    join public.indicator_dictionary dictionary on dictionary.id = assignment.indicator_id
    where assignment.program_id = livelihood_program and dictionary.code = 'makers_supported';
  select id into resolved_indicator from public.program_indicators assignment
    join public.indicator_dictionary dictionary on dictionary.id = assignment.indicator_id
    where assignment.program_id = caregiver_program and dictionary.code = 'support_requests_resolved';
  select id into attendance_indicator from public.program_indicators assignment
    join public.indicator_dictionary dictionary on dictionary.id = assignment.indicator_id
    where assignment.program_id = caregiver_program and dictionary.code = 'event_attendance_rate';

  insert into public.partner_applications (
    id, organization_name, contact_name, contact_email, focus_area, counties, notes, consent_recorded, status
  ) values (
    '00000000-0000-0000-0000-000000000081',
    'Demo Coast Care Network',
    'Amina Demo',
    'demo.partner@example.org',
    'Caregiver support',
    array['Mombasa', 'Kilifi'],
    'Seeded demo partner for local workflow review.',
    true,
    'approved'
  ) on conflict (id) do update set
    organization_name = excluded.organization_name,
    contact_name = excluded.contact_name,
    contact_email = excluded.contact_email,
    focus_area = excluded.focus_area,
    counties = excluded.counties,
    notes = excluded.notes,
    consent_recorded = excluded.consent_recorded,
    status = excluded.status;

  insert into public.partner_due_diligence (
    id, partner_application_id, verification_status, checks, notes, reviewed_by, reviewed_at
  ) values (
    '00000000-0000-0000-0000-000000000085',
    '00000000-0000-0000-0000-000000000081',
    'cleared',
    '{"registration":true,"safeguarding":true,"references":true}',
    'Demo verification record for local review.',
    demo_admin,
    timezone('utc', now())
  ) on conflict (partner_application_id) do update set
    verification_status = excluded.verification_status,
    checks = excluded.checks,
    notes = excluded.notes,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at;

  insert into public.partner_memberships (id, partner_application_id, user_id, membership_status, created_by)
  values ('00000000-0000-0000-0000-000000000086', '00000000-0000-0000-0000-000000000081', demo_admin, 'active', demo_admin)
  on conflict (partner_application_id, user_id) do update set membership_status = excluded.membership_status, created_by = excluded.created_by;

  insert into public.partner_program_assignments (id, partner_application_id, program_id, assignment_status, assigned_by)
  values ('00000000-0000-0000-0000-000000000087', '00000000-0000-0000-0000-000000000081', caregiver_program, 'active', demo_admin)
  on conflict (partner_application_id, program_id) do update set assignment_status = excluded.assignment_status, assigned_by = excluded.assigned_by;

  insert into public.volunteer_applications (
    id, name, email, county, skills, availability, consent_recorded, status
  ) values (
    '00000000-0000-0000-0000-000000000082',
    'Demo Volunteer',
    'demo.volunteer@example.org',
    'Mombasa',
    'Facilitation, translation, community outreach',
    'Two Saturdays per month',
    true,
    'approved'
  ) on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    county = excluded.county,
    skills = excluded.skills,
    availability = excluded.availability,
    consent_recorded = excluded.consent_recorded,
    status = excluded.status;

  insert into public.volunteer_assignments (id, volunteer_application_id, program_id, assignment_status, notes, assigned_by)
  values ('00000000-0000-0000-0000-000000000088', '00000000-0000-0000-0000-000000000082', caregiver_program, 'active', 'Demo assignment for local workflow review.', demo_admin)
  on conflict (id) do update set program_id = excluded.program_id, assignment_status = excluded.assignment_status, notes = excluded.notes, assigned_by = excluded.assigned_by;

  insert into public.event_registrations (id, event_id, name, email, status)
  values ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000071', 'Demo Attendee', 'demo.attendee@example.org', 'registered')
  on conflict (id) do update set name = excluded.name, email = excluded.email, status = excluded.status;

  insert into public.event_attendance (id, registration_id, attendance_status, checked_in_at, notes, marked_by)
  values ('00000000-0000-0000-0000-000000000089', '00000000-0000-0000-0000-000000000083', 'attended', timezone('utc', now()), 'Demo attendance record for local review.', demo_admin)
  on conflict (registration_id) do update set attendance_status = excluded.attendance_status, checked_in_at = excluded.checked_in_at, notes = excluded.notes, marked_by = excluded.marked_by;

  insert into public.engagement_notifications (id, audience_type, title, body, status, created_by, sent_at)
  values ('00000000-0000-0000-0000-00000000008a', 'all', 'Demo: welcome to the local review', 'This seeded notification confirms that engagement workflows are connected for local review.', 'sent', demo_admin, timezone('utc', now()))
  on conflict (id) do update set title = excluded.title, body = excluded.body, status = excluded.status, created_by = excluded.created_by, sent_at = excluded.sent_at;

  insert into public.indicator_observations (
    id, program_indicator_id, county, beneficiary_group, reporting_period_start, reporting_period_end, value, source, notes, validation_status, entered_by, approved_by, approved_at
  ) values
    ('00000000-0000-0000-0000-000000000090', caregiver_indicator, 'Mombasa', 'caregiver_disability', '2026-10-01', '2026-10-31', 24, 'Seeded demo reporting register', 'Demo observation for local review.', 'approved', demo_admin, demo_admin, timezone('utc', now())),
    ('00000000-0000-0000-0000-000000000091', makers_indicator, 'Mombasa', 'economically_vulnerable_woman', '2026-10-01', '2026-10-31', 18, 'Seeded demo reporting register', 'Demo observation for local review.', 'approved', demo_admin, demo_admin, timezone('utc', now())),
    ('00000000-0000-0000-0000-000000000092', resolved_indicator, 'Mombasa', 'caregiver_disability', '2026-10-01', '2026-10-31', 31, 'Seeded demo reporting register', 'Demo observation for local review.', 'approved', demo_admin, demo_admin, timezone('utc', now())),
    ('00000000-0000-0000-0000-000000000093', attendance_indicator, 'Mombasa', null, '2026-10-01', '2026-10-31', 87.5, 'Seeded demo attendance register', 'Demo observation for local review.', 'approved', demo_admin, demo_admin, timezone('utc', now()))
  on conflict (id) do update set
    program_indicator_id = excluded.program_indicator_id,
    county = excluded.county,
    beneficiary_group = excluded.beneficiary_group,
    reporting_period_start = excluded.reporting_period_start,
    reporting_period_end = excluded.reporting_period_end,
    value = excluded.value,
    source = excluded.source,
    notes = excluded.notes,
    validation_status = excluded.validation_status,
    entered_by = excluded.entered_by,
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at;

  insert into public.public_impact_metrics (
    id, metric_key, label, value, unit, period_label, county, beneficiary_group, program_id, public_note, status, source_observation_ids, approved_by, approved_at, created_by
  ) values
    ('00000000-0000-0000-0000-000000000094', 'caregiver_learning_sessions', 'Caregiver learning sessions', 24, 'sessions', 'October 2026', 'Mombasa', 'caregiver_disability', caregiver_program, 'Demo metric for local review; replace with approved reporting data before publication.', 'approved', array['00000000-0000-0000-0000-000000000090'::uuid], demo_admin, timezone('utc', now()), demo_admin),
    ('00000000-0000-0000-0000-000000000095', 'makers_supported', 'Makers supported', 18, 'people', 'October 2026', 'Mombasa', 'economically_vulnerable_woman', livelihood_program, 'Demo metric for local review; replace with approved reporting data before publication.', 'approved', array['00000000-0000-0000-0000-000000000091'::uuid], demo_admin, timezone('utc', now()), demo_admin),
    ('00000000-0000-0000-0000-000000000096', 'support_requests_resolved', 'Support requests resolved', 31, 'requests', 'October 2026', 'Mombasa', 'caregiver_disability', caregiver_program, 'Demo metric for local review; replace with approved reporting data before publication.', 'approved', array['00000000-0000-0000-0000-000000000092'::uuid], demo_admin, timezone('utc', now()), demo_admin),
    ('00000000-0000-0000-0000-000000000097', 'event_attendance_rate', 'Event attendance rate', 87.5, 'percent', 'October 2026', 'Mombasa', null, caregiver_program, 'Demo metric for local review; replace with approved reporting data before publication.', 'approved', array['00000000-0000-0000-0000-000000000093'::uuid], demo_admin, timezone('utc', now()), demo_admin)
  on conflict (id) do update set
    metric_key = excluded.metric_key,
    label = excluded.label,
    value = excluded.value,
    unit = excluded.unit,
    period_label = excluded.period_label,
    county = excluded.county,
    beneficiary_group = excluded.beneficiary_group,
    program_id = excluded.program_id,
    public_note = excluded.public_note,
    status = excluded.status,
    source_observation_ids = excluded.source_observation_ids,
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    created_by = excluded.created_by;
end $$;
