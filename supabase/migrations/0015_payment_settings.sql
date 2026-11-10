-- Payment settings managed by the super administrator.
--
-- giving_settings holds the details donors see (M-Pesa Paybill/Till, bank
-- account) and the online-checkout switch. It is public to read so /donate can
-- render it, and only a superadmin with a verified authenticator can change it.
--
-- payment_provider_credentials holds M-Pesa Daraja credentials. Secret values
-- are encrypted by the application (AES-256-GCM, PAYMENT_ENCRYPTION_KEY) before
-- they reach the database, and the table is not exposed to anon or
-- authenticated users at all: only the server's service role can read it.

create table if not exists public.giving_settings (
  id boolean primary key default true check (id),
  online_checkout_enabled boolean not null default false,
  mpesa_paybill text check (mpesa_paybill is null or mpesa_paybill ~ '^[0-9]{5,7}$'),
  mpesa_account_reference text check (mpesa_account_reference is null or char_length(mpesa_account_reference) between 1 and 12),
  mpesa_till text check (mpesa_till is null or mpesa_till ~ '^[0-9]{5,8}$'),
  bank_name text check (bank_name is null or char_length(bank_name) <= 120),
  bank_account_name text check (bank_account_name is null or char_length(bank_account_name) <= 160),
  bank_account_number text check (bank_account_number is null or char_length(bank_account_number) <= 40),
  bank_branch text check (bank_branch is null or char_length(bank_branch) <= 120),
  bank_swift text check (bank_swift is null or bank_swift ~ '^[A-Z0-9]{8,11}$'),
  giving_note text check (giving_note is null or char_length(giving_note) <= 500),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.giving_settings (id) values (true) on conflict (id) do nothing;

alter table public.giving_settings enable row level security;
revoke all on public.giving_settings from anon, authenticated;
grant select on public.giving_settings to anon, authenticated;
grant update on public.giving_settings to authenticated;

drop policy if exists "giving settings are public" on public.giving_settings;
create policy "giving settings are public" on public.giving_settings
  for select to anon, authenticated using (true);

drop policy if exists "superadmin manages giving settings" on public.giving_settings;
create policy "superadmin manages giving settings" on public.giving_settings
  for update to authenticated
  using (public.has_staff_access('superadmin'))
  with check (public.has_staff_access('superadmin'));

create table if not exists public.payment_provider_credentials (
  provider text primary key check (provider in ('mpesa')),
  environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  shortcode text check (shortcode is null or shortcode ~ '^[0-9]{5,8}$'),
  transaction_type text not null default 'CustomerPayBillOnline' check (transaction_type in ('CustomerPayBillOnline', 'CustomerBuyGoodsOnline')),
  party_b text check (party_b is null or party_b ~ '^[0-9]{5,8}$'),
  consumer_key_encrypted text,
  consumer_secret_encrypted text,
  passkey_encrypted text,
  consumer_key_hint text,
  last_verified_at timestamptz,
  last_verification_error text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.payment_provider_credentials enable row level security;
revoke all on public.payment_provider_credentials from anon, authenticated;

-- Donations paid by M-Pesa STK Push are matched by CheckoutRequestID.
create unique index if not exists donations_checkout_session_idx
  on public.donations(checkout_session_id) where checkout_session_id is not null;

comment on table public.giving_settings is 'Public giving details and the online checkout switch. Superadmin-managed.';
comment on table public.payment_provider_credentials is 'Encrypted payment provider credentials. Service role only.';
