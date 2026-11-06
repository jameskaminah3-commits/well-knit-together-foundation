create extension if not exists pgcrypto;

create type public.app_role as enum (
  'superadmin', 'admin', 'program_manager', 'finance', 'marketplace_manager',
  'content_editor', 'donor', 'partner', 'volunteer', 'beneficiary'
);

create type public.beneficiary_group as enum (
  'caregiver_disability', 'caregiver_vulnerable_group', 'orphan_vulnerable_child',
  'person_with_disability', 'economically_vulnerable_woman', 'wider_community'
);

create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.support_request_status as enum ('new', 'in_review', 'referred', 'in_progress', 'resolved', 'closed');
create type public.product_status as enum ('draft', 'active', 'out_of_stock', 'archived');
create type public.order_status as enum ('pending', 'paid', 'processing', 'fulfilled', 'cancelled', 'refunded');
create type public.donation_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  county text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'sw')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  description text,
  focus_groups public.beneficiary_group[] not null default '{}',
  counties text[] not null default '{}',
  status public.publication_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete set null,
  beneficiary_group public.beneficiary_group not null,
  county text not null,
  subject text not null,
  description text not null,
  status public.support_request_status not null default 'new',
  confidential boolean not null default true,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  image_path text,
  status public.publication_status not null default 'draft',
  consent_recorded boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  maker_story text,
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'KES' check (char_length(currency) = 3),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  status public.product_status not null default 'draft',
  maker_profile_id uuid references public.profiles(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references auth.users(id) on delete set null,
  campaign text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'KES' check (char_length(currency) = 3),
  status public.donation_status not null default 'pending',
  provider text,
  provider_reference text unique,
  donor_email text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  status public.order_status not null default 'pending',
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  currency text not null default 'KES' check (char_length(currency) = 3),
  shipping_details jsonb not null default '{}',
  payment_reference text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create index support_requests_requester_idx on public.support_requests(requester_id);
create index support_requests_status_idx on public.support_requests(status);
create index products_status_idx on public.products(status);
create index donations_status_idx on public.donations(status);
create index orders_customer_idx on public.orders(customer_id);

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = required_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('superadmin', 'admin', 'program_manager', 'finance', 'marketplace_manager', 'content_editor')
  );
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.programs enable row level security;
alter table public.support_requests enable row level security;
alter table public.stories enable row level security;
alter table public.products enable row level security;
alter table public.donations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles, public.user_roles, public.programs, public.support_requests, public.stories, public.products, public.donations, public.orders, public.order_items, public.audit_logs from anon;
revoke all on public.profiles, public.user_roles, public.programs, public.support_requests, public.stories, public.products, public.donations, public.orders, public.order_items, public.audit_logs from authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.programs, public.stories, public.products to anon, authenticated;
grant select, insert, update on public.support_requests to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.donations, public.orders, public.order_items to authenticated;

create policy "users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users can create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "users can view own roles" on public.user_roles for select to authenticated using ((select auth.uid()) = user_id);

create policy "published programs are public" on public.programs for select to anon, authenticated using (status = 'published');
create policy "staff manage programs" on public.programs for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "published stories are public" on public.stories for select to anon, authenticated using (status = 'published');
create policy "staff manage stories" on public.stories for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "active products are public" on public.products for select to anon, authenticated using (status = 'active');
create policy "marketplace staff manage products" on public.products for all to authenticated using (public.has_role('marketplace_manager') or public.has_role('superadmin') or public.has_role('admin')) with check (public.has_role('marketplace_manager') or public.has_role('superadmin') or public.has_role('admin'));

create policy "users create own support requests" on public.support_requests for insert to authenticated with check ((select auth.uid()) = requester_id);
create policy "users view own support requests" on public.support_requests for select to authenticated using ((select auth.uid()) = requester_id or public.is_staff());
create policy "staff update support requests" on public.support_requests for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "donors view own donations" on public.donations for select to authenticated using ((select auth.uid()) = donor_id or public.has_role('finance') or public.has_role('superadmin') or public.has_role('admin'));
create policy "customers view own orders" on public.orders for select to authenticated using ((select auth.uid()) = customer_id or public.has_role('marketplace_manager') or public.has_role('finance') or public.has_role('superadmin') or public.has_role('admin'));
create policy "customers view own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or public.has_role('marketplace_manager') or public.has_role('finance') or public.has_role('superadmin') or public.has_role('admin'))));

create policy "staff view audit logs" on public.audit_logs for select to authenticated using (public.has_role('superadmin') or public.has_role('admin'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
