-- Phase 7 completion and Phase 8: participation operations, measurement, and public evidence.

alter table public.support_referrals
  add column if not exists partner_application_id uuid references public.partner_applications(id) on delete set null;

create table if not exists public.partner_due_diligence (
  id uuid primary key default gen_random_uuid(),
  partner_application_id uuid not null unique references public.partner_applications(id) on delete cascade,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'in_review', 'cleared', 'needs_follow_up', 'declined')),
  checks jsonb not null default '{}',
  notes text not null default '',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.partner_memberships (
  id uuid primary key default gen_random_uuid(),
  partner_application_id uuid not null references public.partner_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_status text not null default 'active' check (membership_status in ('invited', 'active', 'suspended', 'ended')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (partner_application_id, user_id)
);

create table if not exists public.partner_program_assignments (
  id uuid primary key default gen_random_uuid(),
  partner_application_id uuid not null references public.partner_applications(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  assignment_status text not null default 'active' check (assignment_status in ('active', 'paused', 'ended')),
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  unique (partner_application_id, program_id)
);

create table if not exists public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  volunteer_application_id uuid not null references public.volunteer_applications(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  assignment_status text not null default 'proposed' check (assignment_status in ('proposed', 'active', 'completed', 'ended')),
  notes text not null default '',
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.event_registrations(id) on delete cascade,
  attendance_status text not null default 'not_marked' check (attendance_status in ('not_marked', 'attended', 'no_show', 'cancelled')),
  checked_in_at timestamptz,
  notes text not null default '',
  marked_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.engagement_notifications (
  id uuid primary key default gen_random_uuid(),
  audience_type text not null check (audience_type in ('all', 'role', 'county', 'program')),
  audience_key text,
  title text not null check (char_length(title) between 3 and 160),
  body text not null check (char_length(body) between 10 and 4000),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent', 'archived')),
  scheduled_for timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check ((audience_type = 'all' and audience_key is null) or (audience_type <> 'all' and audience_key is not null))
);

create index if not exists partner_memberships_user_idx on public.partner_memberships(user_id, membership_status);
create index if not exists partner_program_assignments_partner_idx on public.partner_program_assignments(partner_application_id, assignment_status);
create index if not exists volunteer_assignments_application_idx on public.volunteer_assignments(volunteer_application_id, assignment_status);
create index if not exists engagement_notifications_audience_idx on public.engagement_notifications(audience_type, audience_key, status);
create index if not exists support_referrals_partner_idx on public.support_referrals(partner_application_id, referral_status);

alter table public.partner_due_diligence enable row level security;
alter table public.partner_memberships enable row level security;
alter table public.partner_program_assignments enable row level security;
alter table public.volunteer_assignments enable row level security;
alter table public.event_attendance enable row level security;
alter table public.engagement_notifications enable row level security;

revoke all on public.partner_due_diligence, public.partner_memberships, public.partner_program_assignments, public.volunteer_assignments, public.event_attendance, public.engagement_notifications from anon, authenticated;
grant select, insert, update on public.partner_due_diligence, public.partner_memberships, public.partner_program_assignments, public.volunteer_assignments, public.event_attendance, public.engagement_notifications to authenticated;
grant select on public.support_referrals to authenticated;

create or replace function public.has_reporting_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid())
        and role in ('superadmin', 'admin', 'program_manager', 'finance')
    );
$$;

create or replace function public.has_partner_workspace_access(p_partner_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.partner_memberships
    where partner_application_id = p_partner_application_id
      and user_id = (select auth.uid())
      and membership_status = 'active'
  );
$$;

create policy "partner staff manage due diligence" on public.partner_due_diligence
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "partners view own due diligence" on public.partner_due_diligence
  for select to authenticated using (public.has_partner_workspace_access(partner_application_id));

create policy "engagement staff manage memberships" on public.partner_memberships
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "partners view own membership" on public.partner_memberships
  for select to authenticated using (user_id = (select auth.uid()));

create policy "engagement staff manage partner assignments" on public.partner_program_assignments
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "partners view assigned programs" on public.partner_program_assignments
  for select to authenticated using (public.has_partner_workspace_access(partner_application_id));

create policy "engagement staff manage volunteer assignments" on public.volunteer_assignments
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "volunteers view own assignments" on public.volunteer_assignments
  for select to authenticated using (exists (
    select 1 from public.volunteer_applications application
    where application.id = volunteer_application_id and application.applicant_id = (select auth.uid())
  ));

create policy "engagement staff manage event attendance" on public.event_attendance
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "registrants view own attendance" on public.event_attendance
  for select to authenticated using (exists (
    select 1 from public.event_registrations registration
    where registration.id = registration_id and (registration.user_id = (select auth.uid()) or lower(registration.email) = lower((select email from auth.users where id = (select auth.uid()))))
  ));

create policy "engagement staff manage notifications" on public.engagement_notifications
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "users view relevant notifications" on public.engagement_notifications
  for select to authenticated using (
    (status = 'sent' or (status = 'scheduled' and (scheduled_for is null or scheduled_for <= timezone('utc', now())))) and (
      audience_type = 'all'
      or (audience_type = 'role' and audience_key in (select role::text from public.user_roles where user_id = (select auth.uid())))
      or (audience_type = 'county' and audience_key = (select county from public.profiles where id = (select auth.uid())))
      or (audience_type = 'program' and exists (
        select 1 from public.partner_program_assignments assignment
        join public.partner_memberships membership on membership.partner_application_id = assignment.partner_application_id
        where assignment.program_id::text = audience_key and membership.user_id = (select auth.uid()) and membership.membership_status = 'active'
      ))
    )
  );

create policy "partners view assigned referrals" on public.support_referrals
  for select to authenticated using (partner_application_id is not null and public.has_partner_workspace_access(partner_application_id));

drop trigger if exists partner_due_diligence_touch_updated_at on public.partner_due_diligence;
create trigger partner_due_diligence_touch_updated_at before update on public.partner_due_diligence for each row execute procedure public.touch_updated_at();

-- Phase 8 reporting model.
create table if not exists public.indicator_dictionary (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  definition text not null,
  unit text not null,
  population_dimension text not null default 'all',
  validation_rules jsonb not null default '{}',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.program_indicators (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  indicator_id uuid not null references public.indicator_dictionary(id) on delete cascade,
  target numeric,
  target_period text,
  aggregation text not null default 'sum' check (aggregation in ('sum', 'count', 'average', 'latest')),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (program_id, indicator_id)
);

create table if not exists public.indicator_observations (
  id uuid primary key default gen_random_uuid(),
  program_indicator_id uuid not null references public.program_indicators(id) on delete restrict,
  county text,
  beneficiary_group public.beneficiary_group,
  reporting_period_start date not null,
  reporting_period_end date not null,
  value numeric not null,
  source text not null,
  notes text not null default '',
  validation_status text not null default 'pending' check (validation_status in ('pending', 'approved', 'rejected')),
  entered_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (reporting_period_end >= reporting_period_start)
);

create table if not exists public.reporting_quality_checks (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.indicator_observations(id) on delete cascade,
  check_code text not null,
  severity text not null default 'error' check (severity in ('warning', 'error')),
  message text not null,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.indicator_observation_history (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.indicator_observations(id) on delete cascade,
  old_value numeric,
  new_value numeric,
  old_status text,
  new_status text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.public_impact_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  label text not null,
  value numeric not null check (value >= 0),
  unit text not null,
  period_label text not null,
  county text,
  beneficiary_group public.beneficiary_group,
  program_id uuid references public.programs(id) on delete set null,
  public_note text not null default '',
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  source_observation_ids uuid[] not null default '{}',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists indicator_observations_dimensions_idx on public.indicator_observations(program_indicator_id, county, beneficiary_group, reporting_period_end);
create index if not exists reporting_quality_checks_observation_idx on public.reporting_quality_checks(observation_id, resolved_at);
create index if not exists public_impact_metrics_public_idx on public.public_impact_metrics(status, period_label);

alter table public.indicator_dictionary enable row level security;
alter table public.program_indicators enable row level security;
alter table public.indicator_observations enable row level security;
alter table public.reporting_quality_checks enable row level security;
alter table public.indicator_observation_history enable row level security;
alter table public.public_impact_metrics enable row level security;

revoke all on public.indicator_dictionary, public.program_indicators, public.indicator_observations, public.reporting_quality_checks, public.indicator_observation_history, public.public_impact_metrics from anon, authenticated;
grant select, insert, update on public.indicator_dictionary, public.program_indicators, public.indicator_observations, public.reporting_quality_checks, public.indicator_observation_history, public.public_impact_metrics to authenticated;
grant select on public.public_impact_metrics to anon;

create policy "reporting staff manage indicator dictionary" on public.indicator_dictionary for all to authenticated using (public.has_reporting_access()) with check (public.has_reporting_access());
create policy "reporting staff manage program indicators" on public.program_indicators for all to authenticated using (public.has_reporting_access()) with check (public.has_reporting_access());
create policy "reporting staff manage observations" on public.indicator_observations for all to authenticated using (public.has_reporting_access()) with check (public.has_reporting_access());
create policy "reporting staff manage quality checks" on public.reporting_quality_checks for all to authenticated using (public.has_reporting_access()) with check (public.has_reporting_access());
create policy "reporting staff view observation history" on public.indicator_observation_history for select to authenticated using (public.has_reporting_access());
create policy "reporting staff manage public metrics" on public.public_impact_metrics for all to authenticated using (public.has_reporting_access()) with check (public.has_reporting_access());
create policy "approved public impact metrics are public" on public.public_impact_metrics for select to anon, authenticated using (status = 'approved');

create or replace function public.indicator_value_errors(p_rules jsonb, p_value numeric)
returns text[]
language plpgsql
immutable
as $$
declare
  errors text[] := '{}';
begin
  if p_rules ? 'min' and p_value < (p_rules->>'min')::numeric then errors := array_append(errors, 'value is below the configured minimum'); end if;
  if p_rules ? 'max' and p_value > (p_rules->>'max')::numeric then errors := array_append(errors, 'value is above the configured maximum'); end if;
  if coalesce((p_rules->>'whole_number')::boolean, false) and p_value <> trunc(p_value) then errors := array_append(errors, 'value must be a whole number'); end if;
  return errors;
end;
$$;

create or replace function public.record_indicator_observation(
  p_program_indicator_id uuid,
  p_county text,
  p_beneficiary_group public.beneficiary_group,
  p_reporting_period_start date,
  p_reporting_period_end date,
  p_value numeric,
  p_source text,
  p_notes text default ''
)
returns table (observation_id uuid, validation_status text, errors text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  indicator_rules jsonb;
  validation_errors text[];
  created_id uuid;
begin
  if not public.has_reporting_access() then raise exception 'reporting access required'; end if;
  if p_reporting_period_end < p_reporting_period_start then raise exception 'reporting period is invalid'; end if;
  select dictionary.validation_rules into indicator_rules
  from public.program_indicators assignment
  join public.indicator_dictionary dictionary on dictionary.id = assignment.indicator_id
  where assignment.id = p_program_indicator_id and assignment.active = true and dictionary.active = true;
  if not found then raise exception 'active program indicator not found'; end if;
  validation_errors := public.indicator_value_errors(coalesce(indicator_rules, '{}'), p_value);
  insert into public.indicator_observations (program_indicator_id, county, beneficiary_group, reporting_period_start, reporting_period_end, value, source, notes, validation_status, entered_by)
  values (p_program_indicator_id, nullif(trim(p_county), ''), p_beneficiary_group, p_reporting_period_start, p_reporting_period_end, p_value, trim(p_source), coalesce(trim(p_notes), ''), case when coalesce(array_length(validation_errors, 1), 0) > 0 then 'rejected' else 'pending' end, auth.uid())
  returning id into created_id;
  if coalesce(array_length(validation_errors, 1), 0) > 0 then
    insert into public.reporting_quality_checks (observation_id, check_code, severity, message)
    select created_id, 'validation_rule', 'error', error_message from unnest(validation_errors) as error_message;
  end if;
  return query select created_id, case when coalesce(array_length(validation_errors, 1), 0) > 0 then 'rejected' else 'pending' end, validation_errors;
end;
$$;

revoke all on function public.record_indicator_observation(uuid, text, public.beneficiary_group, date, date, numeric, text, text) from public;
grant execute on function public.record_indicator_observation(uuid, text, public.beneficiary_group, date, date, numeric, text, text) to authenticated;

create or replace function public.log_indicator_observation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.value is distinct from new.value or old.validation_status is distinct from new.validation_status then
    insert into public.indicator_observation_history (observation_id, old_value, new_value, old_status, new_status, changed_by)
    values (new.id, old.value, new.value, old.validation_status, new.validation_status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists indicator_observation_change_history on public.indicator_observations;
create trigger indicator_observation_change_history after update on public.indicator_observations for each row execute procedure public.log_indicator_observation_change();

drop trigger if exists indicator_observations_touch_updated_at on public.indicator_observations;
create trigger indicator_observations_touch_updated_at before update on public.indicator_observations for each row execute procedure public.touch_updated_at();
drop trigger if exists public_impact_metrics_touch_updated_at on public.public_impact_metrics;
create trigger public_impact_metrics_touch_updated_at before update on public.public_impact_metrics for each row execute procedure public.touch_updated_at();

alter table public.content_items
  add column if not exists report_year integer,
  add column if not exists report_category text check (report_category is null or report_category in ('annual', 'financial', 'programme', 'evidence')),
  add column if not exists evidence_label text;

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

