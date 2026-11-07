-- Phase 2 security hardening.
-- Staff access requires an authenticated Supabase AAL2 session.

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.app_role not null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  auth_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index staff_invitations_email_idx on public.staff_invitations(lower(email));
create index staff_invitations_status_idx on public.staff_invitations(status);

alter table public.staff_invitations enable row level security;
revoke all on public.staff_invitations from anon, authenticated;
grant select on public.staff_invitations to authenticated;

create or replace function public.has_staff_access(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
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
  select (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid())
        and role in ('superadmin', 'admin', 'program_manager', 'finance', 'marketplace_manager', 'content_editor')
    );
$$;

create policy "admins view staff invitations" on public.staff_invitations
  for select to authenticated
  using (public.has_staff_access('admin') or public.has_staff_access('superadmin'));

drop policy if exists "staff manage programs" on public.programs;
create policy "staff manage programs" on public.programs
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff manage stories" on public.stories;
create policy "staff manage stories" on public.stories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "marketplace staff manage products" on public.products;
create policy "marketplace staff manage products" on public.products
  for all to authenticated
  using (public.has_staff_access('marketplace_manager') or public.has_staff_access('superadmin') or public.has_staff_access('admin'))
  with check (public.has_staff_access('marketplace_manager') or public.has_staff_access('superadmin') or public.has_staff_access('admin'));

drop policy if exists "users view own support requests" on public.support_requests;
create policy "users view own support requests" on public.support_requests
  for select to authenticated using ((select auth.uid()) = requester_id or public.is_staff());

drop policy if exists "staff update support requests" on public.support_requests;
create policy "staff update support requests" on public.support_requests
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "donors view own donations" on public.donations;
create policy "donors view own donations" on public.donations
  for select to authenticated
  using ((select auth.uid()) = donor_id or public.has_staff_access('finance') or public.has_staff_access('superadmin') or public.has_staff_access('admin'));

drop policy if exists "customers view own orders" on public.orders;
create policy "customers view own orders" on public.orders
  for select to authenticated
  using ((select auth.uid()) = customer_id or public.has_staff_access('marketplace_manager') or public.has_staff_access('finance') or public.has_staff_access('superadmin') or public.has_staff_access('admin'));

drop policy if exists "customers view own order items" on public.order_items;
create policy "customers view own order items" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.customer_id = (select auth.uid()) or public.has_staff_access('marketplace_manager') or public.has_staff_access('finance') or public.has_staff_access('superadmin') or public.has_staff_access('admin'))
  ));

drop policy if exists "staff view audit logs" on public.audit_logs;
create policy "staff view audit logs" on public.audit_logs
  for select to authenticated
  using (public.has_staff_access('superadmin') or public.has_staff_access('admin'));
