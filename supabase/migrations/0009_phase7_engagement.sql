-- Phase 7: partners, volunteers, learning events, and community participation.

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references auth.users(id) on delete set null,
  organization_name text not null,
  contact_name text not null,
  contact_email text not null,
  focus_area text not null,
  counties text[] not null default '{}',
  notes text not null,
  consent_recorded boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'in_review', 'approved', 'declined', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  county text,
  skills text not null,
  availability text not null,
  consent_recorded boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'in_review', 'approved', 'declined', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null,
  capacity integer check (capacity is null or capacity > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'archived')),
  registration_deadline timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.engagement_events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  status text not null default 'registered' check (status in ('registered', 'waitlisted', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, email)
);

create index if not exists partner_applications_status_idx on public.partner_applications(status);
create index if not exists volunteer_applications_status_idx on public.volunteer_applications(status);
create index if not exists engagement_events_start_idx on public.engagement_events(starts_at, status);
create index if not exists event_registrations_event_idx on public.event_registrations(event_id, status);

alter table public.partner_applications enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.engagement_events enable row level security;
alter table public.event_registrations enable row level security;

revoke all on public.partner_applications, public.volunteer_applications, public.engagement_events, public.event_registrations from anon;
revoke all on public.partner_applications, public.volunteer_applications, public.engagement_events, public.event_registrations from authenticated;
grant insert on public.partner_applications, public.volunteer_applications to anon, authenticated;
grant select on public.engagement_events to anon, authenticated;
grant select on public.partner_applications, public.volunteer_applications, public.event_registrations to authenticated;

create policy "public can submit partner applications" on public.partner_applications
  for insert to anon, authenticated
  with check (status = 'pending' and consent_recorded = true and (applicant_id is null or applicant_id = (select auth.uid())));

create policy "applicants can view own partner applications" on public.partner_applications
  for select to authenticated
  using (applicant_id = (select auth.uid()));

create policy "public can submit volunteer applications" on public.volunteer_applications
  for insert to anon, authenticated
  with check (status = 'pending' and consent_recorded = true and (applicant_id is null or applicant_id = (select auth.uid())));

create policy "applicants can view own volunteer applications" on public.volunteer_applications
  for select to authenticated
  using (applicant_id = (select auth.uid()));

create policy "published engagement events are public" on public.engagement_events
  for select to anon, authenticated
  using (status = 'published' and (registration_deadline is null or registration_deadline > timezone('utc', now())));

create policy "users can view own event registrations" on public.event_registrations
  for select to authenticated
  using (user_id = (select auth.uid()) or email = (select email from auth.users where id = (select auth.uid())));

create or replace function public.has_engagement_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_staff_access('admin') or public.has_staff_access('superadmin') or public.has_staff_access('program_manager') or public.has_staff_access('marketplace_manager');
$$;

create policy "engagement staff manage partner applications" on public.partner_applications
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "engagement staff manage volunteer applications" on public.volunteer_applications
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "engagement staff manage events" on public.engagement_events
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());
create policy "engagement staff manage registrations" on public.event_registrations
  for all to authenticated using (public.has_engagement_access()) with check (public.has_engagement_access());

create or replace function public.register_for_engagement_event(p_event_id uuid, p_name text, p_email text)
returns table (registration_id uuid, registration_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  event_row record;
  registration_count integer;
  next_status text := 'registered';
  registration_id_value uuid;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_email), '') = '' then raise exception 'name and email are required'; end if;
  select id, capacity, status, registration_deadline into event_row from public.engagement_events where id = p_event_id for update;
  if not found or event_row.status <> 'published' then raise exception 'event is not available'; end if;
  if event_row.registration_deadline is not null and event_row.registration_deadline <= timezone('utc', now()) then raise exception 'registration is closed'; end if;
  if exists (select 1 from public.event_registrations where event_id = p_event_id and lower(email) = lower(trim(p_email)) and status <> 'cancelled') then raise exception 'this email is already registered'; end if;
  select count(*) into registration_count from public.event_registrations where event_id = p_event_id and status = 'registered';
  if event_row.capacity is not null and registration_count >= event_row.capacity then next_status := 'waitlisted'; end if;
  insert into public.event_registrations (event_id, user_id, name, email, status) values (p_event_id, current_user_id, trim(p_name), lower(trim(p_email)), next_status) returning id into registration_id_value;
  return query select registration_id_value, next_status;
end;
$$;

revoke all on function public.register_for_engagement_event(uuid, text, text) from public;
grant execute on function public.register_for_engagement_event(uuid, text, text) to anon, authenticated;

insert into public.engagement_events (id, slug, title, summary, description, starts_at, ends_at, location, capacity, status, registration_deadline)
values
  ('00000000-0000-0000-0000-000000000071', 'caregiver-peer-learning-lab', 'Caregiver peer learning lab', 'A practical morning for sharing what helps care feel more possible.', 'A facilitated learning circle for caregivers and community practitioners. We will trade practical tools, make room for lived expertise, and leave with one small next step each.', '2026-11-21T07:00:00Z', '2026-11-21T10:00:00Z', 'Kisumu · venue shared after registration', 30, 'published', '2026-11-20T18:00:00Z'),
  ('00000000-0000-0000-0000-000000000072', 'maker-market-studio-session', 'Maker market studio session', 'A working session on product readiness, pricing, and customer care.', 'A focused studio session for supported makers building a clear, sustainable route from careful work to dependable sales.', '2026-11-28T08:00:00Z', '2026-11-28T11:00:00Z', 'Online · link shared after registration', 25, 'published', '2026-11-27T18:00:00Z'),
  ('00000000-0000-0000-0000-000000000073', 'inclusive-practice-roundtable', 'Inclusive practice roundtable', 'A cross-sector conversation about belonging, access, and useful partnership.', 'A small roundtable for partners, volunteers, and practitioners who want to make inclusion a daily practice rather than a statement.', '2026-12-05T08:00:00Z', '2026-12-05T11:00:00Z', 'Nairobi · invitation-led room', 40, 'published', '2026-12-04T18:00:00Z')
on conflict (id) do update set title = excluded.title, summary = excluded.summary, description = excluded.description, starts_at = excluded.starts_at, ends_at = excluded.ends_at, location = excluded.location, capacity = excluded.capacity, status = excluded.status, registration_deadline = excluded.registration_deadline;
