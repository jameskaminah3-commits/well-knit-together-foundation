-- Phase 11: Resend-ready transactional email delivery, preferences, and auditability.

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  message_type text not null,
  recipient_email text not null,
  recipient_user_id uuid references auth.users(id) on delete set null,
  subject text not null,
  dedupe_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider text not null default 'resend',
  provider_message_id text,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_messages_status_idx on public.email_messages(status, created_at desc);
create index if not exists email_messages_recipient_idx on public.email_messages(recipient_email, created_at desc);

create table if not exists public.email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'sw')),
  event_updates boolean not null default true,
  support_updates boolean not null default true,
  giving_updates boolean not null default true,
  marketplace_updates boolean not null default true,
  impact_updates boolean not null default true,
  marketing_opt_in boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.email_messages enable row level security;
alter table public.email_preferences enable row level security;

alter table public.email_messages add column if not exists delivery_status text not null default 'accepted' check (delivery_status in ('accepted', 'delivered', 'bounced', 'complained', 'failed'));

revoke all on public.email_messages, public.email_preferences from anon, authenticated;
grant select on public.email_messages to authenticated;
grant select, insert, update on public.email_preferences to authenticated;

create policy "staff can view email delivery records" on public.email_messages
  for select to authenticated
  using (public.has_staff_access('admin') or public.has_staff_access('superadmin'));

create policy "users can view own email preferences" on public.email_preferences
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "users can manage own email preferences" on public.email_preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
