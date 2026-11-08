-- Phase 4: safe support intake, case management, referrals, and export approvals.

alter table public.support_requests
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists preferred_contact_method text not null default 'phone'
    check (preferred_contact_method in ('phone', 'email', 'sms', 'whatsapp', 'none')),
  add column if not exists preferred_contact_window text,
  add column if not exists need_category text not null default 'other',
  add column if not exists urgency text not null default 'normal'
    check (urgency in ('low', 'normal', 'high', 'urgent')),
  add column if not exists consent_to_contact boolean not null default false,
  add column if not exists safeguarding_concern boolean not null default false,
  add column if not exists safeguarding_flag boolean not null default false,
  add column if not exists safeguarding_summary text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists closure_reason text,
  add column if not exists retention_until timestamptz not null default timezone('utc', now()) + interval '2 years',
  add column if not exists redacted_at timestamptz,
  add column if not exists submission_channel text not null default 'web'
    check (submission_channel in ('web', 'account', 'assisted', 'phone', 'referral'));

alter table public.support_requests
  drop constraint if exists support_requests_description_length,
  add constraint support_requests_description_length check (char_length(description) between 10 and 2000),
  drop constraint if exists support_requests_contact_consent_check,
  add constraint support_requests_contact_consent_check check (
    consent_to_contact = false or preferred_contact_method <> 'none'
  );

create index if not exists support_requests_urgency_status_idx on public.support_requests(urgency, status);
create index if not exists support_requests_follow_up_idx on public.support_requests(follow_up_at);
create index if not exists support_requests_retention_idx on public.support_requests(retention_until);

create table if not exists public.support_request_events (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('created', 'status_changed', 'assignment_changed', 'referral_added', 'follow_up_changed', 'redacted', 'note_added')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_request_events_request_idx on public.support_request_events(support_request_id, created_at desc);

create table if not exists public.support_request_notes (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  note text not null check (char_length(note) between 1 and 4000),
  is_internal boolean not null default true check (is_internal = true),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_request_notes_request_idx on public.support_request_notes(support_request_id, created_at desc);

create table if not exists public.support_referrals (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  partner_name text not null check (char_length(partner_name) between 2 and 160),
  partner_contact text,
  referral_status text not null default 'pending' check (referral_status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  referred_at timestamptz not null default timezone('utc', now()),
  response_due_at timestamptz,
  outcome text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_referrals_request_idx on public.support_referrals(support_request_id, created_at desc);

create table if not exists public.support_export_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  reason text not null check (char_length(reason) between 10 and 500),
  filters jsonb not null default '{}',
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_export_requests_status_idx on public.support_export_requests(status, created_at desc);

alter table public.support_request_events enable row level security;
alter table public.support_request_notes enable row level security;
alter table public.support_referrals enable row level security;
alter table public.support_export_requests enable row level security;

revoke all on public.support_request_events, public.support_request_notes, public.support_referrals, public.support_export_requests from anon, authenticated;
grant select on public.support_request_events to authenticated;
grant select, insert on public.support_request_notes, public.support_referrals to authenticated;
grant select, insert on public.support_export_requests to authenticated;
grant update on public.support_requests, public.support_referrals, public.support_export_requests to authenticated;

create or replace function public.has_case_access()
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
        and role in ('superadmin', 'admin', 'program_manager')
    );
$$;

create or replace function public.has_export_approval_access()
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
        and role in ('superadmin', 'admin')
    );
$$;

drop policy if exists "users create own support requests" on public.support_requests;
drop policy if exists "users view own support requests" on public.support_requests;
drop policy if exists "staff update support requests" on public.support_requests;

create policy "public and users can submit support requests" on public.support_requests
  for insert to anon, authenticated
  with check (
    (select auth.uid()) is null and requester_id is null
    or (select auth.uid()) = requester_id
  );

create policy "requesters and case staff can view support requests" on public.support_requests
  for select to authenticated
  using ((select auth.uid()) = requester_id or public.has_case_access());

create policy "case staff can update support requests" on public.support_requests
  for update to authenticated
  using (public.has_case_access())
  with check (public.has_case_access());

create policy "requesters and case staff can view safe request events" on public.support_request_events
  for select to authenticated
  using (exists (
    select 1 from public.support_requests r
    where r.id = support_request_id
      and (r.requester_id = (select auth.uid()) or public.has_case_access())
  ));

create policy "case staff can view internal notes" on public.support_request_notes
  for select to authenticated using (public.has_case_access());
create policy "case staff can create internal notes" on public.support_request_notes
  for insert to authenticated
  with check (public.has_case_access() and author_id = (select auth.uid()));

create policy "case staff can view referrals" on public.support_referrals
  for select to authenticated using (public.has_case_access());
create policy "case staff can create referrals" on public.support_referrals
  for insert to authenticated
  with check (public.has_case_access() and created_by = (select auth.uid()));
create policy "case staff can update referrals" on public.support_referrals
  for update to authenticated using (public.has_case_access()) with check (public.has_case_access());

create policy "case staff can view own export requests" on public.support_export_requests
  for select to authenticated
  using (requested_by = (select auth.uid()) or public.has_export_approval_access());
create policy "case staff can request exports" on public.support_export_requests
  for insert to authenticated
  with check (public.has_case_access() and requested_by = (select auth.uid()));
create policy "admins can approve exports" on public.support_export_requests
  for update to authenticated
  using (public.has_export_approval_access())
  with check (public.has_export_approval_access());

create or replace function public.log_support_request_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.support_request_events (support_request_id, actor_id, event_type, metadata)
    values (new.id, auth.uid(), 'created', jsonb_build_object('status', new.status, 'submission_channel', new.submission_channel));
  elsif new.status is distinct from old.status then
    insert into public.support_request_events (support_request_id, actor_id, event_type, metadata)
    values (new.id, auth.uid(), 'status_changed', jsonb_build_object('from', old.status, 'to', new.status));
  elsif new.assigned_to is distinct from old.assigned_to then
    insert into public.support_request_events (support_request_id, actor_id, event_type, metadata)
    values (new.id, auth.uid(), 'assignment_changed', jsonb_build_object('assigned_to', new.assigned_to));
  elsif new.follow_up_at is distinct from old.follow_up_at then
    insert into public.support_request_events (support_request_id, actor_id, event_type, metadata)
    values (new.id, auth.uid(), 'follow_up_changed', jsonb_build_object('follow_up_at', new.follow_up_at));
  elsif new.redacted_at is distinct from old.redacted_at then
    insert into public.support_request_events (support_request_id, actor_id, event_type, metadata)
    values (new.id, auth.uid(), 'redacted', '{}'::jsonb);
  end if;
  return new;
end;
$$;

drop trigger if exists support_requests_audit_event on public.support_requests;
create trigger support_requests_audit_event
  after insert or update on public.support_requests
  for each row execute procedure public.log_support_request_event();

drop trigger if exists support_referrals_touch_updated_at on public.support_referrals;
create trigger support_referrals_touch_updated_at before update on public.support_referrals for each row execute procedure public.touch_updated_at();

create or replace function public.log_support_related_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.support_request_events (support_request_id, actor_id, event_type, metadata)
  values (
    coalesce(new.support_request_id, old.support_request_id),
    auth.uid(),
    case when tg_table_name = 'support_request_notes' then 'note_added' else 'referral_added' end,
    case when tg_table_name = 'support_request_notes'
      then jsonb_build_object('note_id', new.id)
      else jsonb_build_object('referral_id', new.id, 'partner_name', new.partner_name)
    end
  );
  return new;
end;
$$;

drop trigger if exists support_notes_audit_event on public.support_request_notes;
create trigger support_notes_audit_event after insert on public.support_request_notes for each row execute procedure public.log_support_related_event();
drop trigger if exists support_referrals_audit_event on public.support_referrals;
create trigger support_referrals_audit_event after insert on public.support_referrals for each row execute procedure public.log_support_related_event();

-- A scheduled job or reviewed admin workflow can redact rows after retention_until.
create or replace function public.redact_expired_support_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.support_requests
  set contact_name = null,
      contact_email = null,
      contact_phone = null,
      description = '[redacted after retention period]',
      safeguarding_summary = null,
      closure_reason = coalesce(closure_reason, 'Retention period expired'),
      redacted_at = timezone('utc', now())
  where retention_until < timezone('utc', now()) and redacted_at is null;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke execute on function public.redact_expired_support_requests() from public, anon, authenticated;
