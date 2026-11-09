-- Phase 9 and 10: production readiness, feedback, and accountable improvement.

create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  area text not null check (area in ('website', 'support', 'events', 'marketplace', 'giving', 'workspace', 'other')),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(trim(message)) between 10 and 2000),
  contact_email text,
  consent_recorded boolean not null default false,
  status text not null default 'new' check (status in ('new', 'reviewed', 'closed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists site_feedback_status_idx on public.site_feedback(status, created_at desc);
alter table public.site_feedback enable row level security;
revoke all on public.site_feedback from anon, authenticated;
grant insert on public.site_feedback to anon, authenticated;
grant select, update on public.site_feedback to authenticated;

create policy "public can send feedback" on public.site_feedback
  for insert to anon, authenticated
  with check (consent_recorded = true);

create policy "staff can review feedback" on public.site_feedback
  for select to authenticated
  using (public.has_staff_access('admin') or public.has_staff_access('program_manager'));

create policy "staff can update feedback" on public.site_feedback
  for update to authenticated
  using (public.has_staff_access('admin') or public.has_staff_access('program_manager'))
  with check (public.has_staff_access('admin') or public.has_staff_access('program_manager'));
