-- Phase 5: campaigns, safe donation intents, payment reconciliation, and receipts.

create table if not exists public.fundraising_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  goal_amount numeric(12, 2) not null check (goal_amount > 0),
  raised_amount numeric(12, 2) not null default 0 check (raised_amount >= 0),
  currency text not null default 'KES' check (char_length(currency) = 3),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists fundraising_campaigns_status_idx on public.fundraising_campaigns(status, starts_at, ends_at);

alter table public.donations
  add column if not exists campaign_id uuid references public.fundraising_campaigns(id) on delete set null,
  add column if not exists donor_name text,
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists recurring boolean not null default false,
  add column if not exists consent_to_updates boolean not null default false,
  add column if not exists receipt_email text,
  add column if not exists idempotency_key text,
  add column if not exists checkout_session_id text,
  add column if not exists failure_reason text,
  add column if not exists reconciled_at timestamptz,
  add column if not exists reconciled_by uuid references auth.users(id) on delete set null,
  add column if not exists receipt_number text;

create unique index if not exists donations_idempotency_key_idx on public.donations(idempotency_key) where idempotency_key is not null;
create unique index if not exists donations_receipt_number_idx on public.donations(receipt_number) where receipt_number is not null;
create index if not exists donations_campaign_status_idx on public.donations(campaign_id, status, created_at desc);

create table if not exists public.donor_preferences (
  donor_id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'sw')),
  consent_to_updates boolean not null default false,
  receipt_email text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.donation_receipts (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null unique references public.donations(id) on delete cascade,
  receipt_number text not null unique,
  delivery_email text,
  status text not null default 'ready' check (status in ('ready', 'sent', 'failed')),
  issued_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null unique,
  event_type text not null,
  donation_id uuid references public.donations(id) on delete set null,
  payment_reference text,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  payload jsonb not null default '{}',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists payment_events_donation_idx on public.payment_events(donation_id, created_at desc);

insert into public.fundraising_campaigns (slug, title, summary, goal_amount, currency, status)
values (
  'care-capacity-opportunity-2026',
  'Care, capacity, opportunity',
  'Help caregivers and communities access practical support, skills, and inclusive opportunity across Kenya.',
  500000,
  'KES',
  'active'
)
on conflict (slug) do nothing;

alter table public.fundraising_campaigns enable row level security;
alter table public.donor_preferences enable row level security;
alter table public.donation_receipts enable row level security;
alter table public.payment_events enable row level security;

revoke all on public.fundraising_campaigns, public.donations, public.donor_preferences, public.donation_receipts, public.payment_events from anon, authenticated;
grant select on public.fundraising_campaigns to anon, authenticated;
grant insert on public.donations to anon, authenticated;
grant select on public.donations, public.donation_receipts to authenticated;
grant select, insert, update on public.donor_preferences to authenticated;

create or replace function public.has_finance_access()
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
        and role in ('finance', 'superadmin', 'admin')
    );
$$;

drop policy if exists "active fundraising campaigns are public" on public.fundraising_campaigns;
create policy "active fundraising campaigns are public" on public.fundraising_campaigns
  for select to anon, authenticated
  using (
    status = 'active'
    and (starts_at is null or starts_at <= timezone('utc', now()))
    and (ends_at is null or ends_at >= timezone('utc', now()))
  );

drop policy if exists "public donation intents can be created" on public.donations;
create policy "public donation intents can be created" on public.donations
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and provider is null
    and provider_reference is null
    and ((select auth.uid()) is null and donor_id is null or (select auth.uid()) = donor_id)
  );

drop policy if exists "donors view own donations" on public.donations;
create policy "donors view own donations" on public.donations
  for select to authenticated
  using ((select auth.uid()) = donor_id or public.has_finance_access());

create policy "donors view own receipts" on public.donation_receipts
  for select to authenticated
  using (exists (
    select 1 from public.donations d
    where d.id = donation_id
      and (d.donor_id = (select auth.uid()) or public.has_finance_access())
  ));

create policy "donors manage own preferences" on public.donor_preferences
  for all to authenticated
  using (donor_id = (select auth.uid()))
  with check (donor_id = (select auth.uid()));

create or replace function public.issue_donation_receipt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_number text;
begin
  if new.status = 'succeeded' and (old.status is distinct from new.status or new.receipt_number is null) then
    generated_number := coalesce(new.receipt_number, 'WKT-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || upper(left(replace(new.id::text, '-', ''), 10)));
    update public.donations
    set receipt_number = generated_number,
        reconciled_at = coalesce(reconciled_at, timezone('utc', now()))
    where id = new.id;
    insert into public.donation_receipts (donation_id, receipt_number, delivery_email)
    values (new.id, generated_number, new.receipt_email)
    on conflict (donation_id) do update set receipt_number = excluded.receipt_number, delivery_email = excluded.delivery_email;
  end if;
  return new;
end;
$$;

drop trigger if exists donations_issue_receipt on public.donations;
create trigger donations_issue_receipt
  after update of status on public.donations
  for each row execute procedure public.issue_donation_receipt();

create or replace function public.sync_campaign_raised_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.campaign_id is distinct from new.campaign_id then
    update public.fundraising_campaigns set raised_amount = coalesce((select sum(amount) from public.donations where campaign_id = old.campaign_id and status = 'succeeded'), 0), updated_at = timezone('utc', now()) where id = old.campaign_id;
  end if;
  if new.campaign_id is not null then
    update public.fundraising_campaigns set raised_amount = coalesce((select sum(amount) from public.donations where campaign_id = new.campaign_id and status = 'succeeded'), 0), updated_at = timezone('utc', now()) where id = new.campaign_id;
  end if;
  return new;
end;
$$;

drop trigger if exists donations_sync_campaign_total on public.donations;
create trigger donations_sync_campaign_total
  after insert or update of campaign_id, status, amount on public.donations
  for each row execute procedure public.sync_campaign_raised_amount();

create or replace function public.touch_fundraising_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists fundraising_campaigns_touch_updated_at on public.fundraising_campaigns;
create trigger fundraising_campaigns_touch_updated_at before update on public.fundraising_campaigns for each row execute procedure public.touch_fundraising_updated_at();
