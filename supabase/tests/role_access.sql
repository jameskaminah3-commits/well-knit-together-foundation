-- Role access regression tests.
-- Run against a local or staging database loaded with supabase/seed.sql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/role_access.sql
-- Each check signs in as a demo account (by setting the JWT claims PostgREST
-- would set) and asserts what that role can see or change. Everything runs in
-- a transaction that is rolled back.

\set QUIET on
\pset tuples_only on
\pset format unaligned
begin;

create function pg_temp.act_as(account_suffix text, assurance text default 'aal2') returns void language plpgsql as $$
declare
  account uuid := ('d1000000-0000-4000-8000-0000000000' || account_suffix)::uuid;
  account_email text := (select email from auth.users where id = account);
begin
  perform set_config('request.jwt.claims', json_build_object('sub', account, 'role', 'authenticated', 'aal', assurance, 'email', account_email)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.expect(label text, actual bigint, expected bigint) returns void language plpgsql as $$
begin
  if actual is distinct from expected then raise exception 'FAIL %: expected %, got %', label, expected, actual; end if;
  raise notice 'ok  %', label;
end $$;

create function pg_temp.expect_blocked(label text, statement text) returns void language plpgsql as $$
declare affected bigint;
begin
  begin
    execute statement;
    get diagnostics affected = row_count;
    if affected > 0 then raise exception 'FAIL %: statement was allowed', label; end if;
  exception when insufficient_privilege or check_violation or raise_exception or others then
    if sqlerrm like 'FAIL %' then raise; end if;
  end;
  raise notice 'ok  % (blocked)', label;
end $$;

-- Caregiver: only their own requests, nothing else private.
select pg_temp.act_as('10', 'aal1');
select pg_temp.expect('caregiver sees own support requests', (select count(*) from public.support_requests), 2);
select pg_temp.expect('caregiver sees no case notes', (select count(*) from public.support_request_notes), 0);
select pg_temp.expect('caregiver sees no gifts', (select count(*) from public.donations), 0);
select pg_temp.expect('caregiver sees own event registration', (select count(*) from public.event_registrations), 1);
select pg_temp.expect_blocked('caregiver cannot grant herself a role', $$insert into public.user_roles (user_id, role) values ('d1000000-0000-4000-8000-000000000010', 'admin')$$);
reset role;

-- Donor: own gifts and orders only.
select pg_temp.act_as('07', 'aal1');
select pg_temp.expect('donor sees own gifts', (select count(*) from public.donations), 3);
select pg_temp.expect('donor sees own orders', (select count(*) from public.orders), 2);
select pg_temp.expect('donor sees no support cases', (select count(*) from public.support_requests), 0);
select pg_temp.expect_blocked('donor cannot mark a gift paid', $$update public.donations set status = 'succeeded' where donor_id = 'd1000000-0000-4000-8000-000000000007'$$);
reset role;

-- Partner: their organisation's referrals, never case notes or contact details.
select pg_temp.act_as('08', 'aal1');
select pg_temp.expect('partner sees own organisation referrals', (select count(*) from public.support_referrals), 2);
select pg_temp.expect('partner sees no support cases', (select count(*) from public.support_requests), 0);
select pg_temp.expect('partner sees assigned programmes', (select count(*) from public.partner_program_assignments), 2);
select pg_temp.expect('partner can accept an open referral', (select count(*) from (select public.partner_update_referral((select id from public.support_referrals where referral_status = 'pending' limit 1), 'accepted', 'Visit booked')) as result), 1);
reset role;

-- Volunteer: own application and assignment.
select pg_temp.act_as('09', 'aal1');
select pg_temp.expect('volunteer sees own application', (select count(*) from public.volunteer_applications), 1);
select pg_temp.expect('volunteer sees own assignment', (select count(*) from public.volunteer_assignments), 1);
select pg_temp.expect('volunteer sees no support cases', (select count(*) from public.support_requests), 0);
reset role;

-- Staff without two-step verification see nothing private.
select pg_temp.act_as('03', 'aal1');
select pg_temp.expect('program manager without MFA sees no cases', (select count(*) from public.support_requests), 0);
reset role;

-- Program manager with MFA: cases, notes, registrations, observations; no money.
select pg_temp.act_as('03');
select pg_temp.expect('program manager sees all cases', (select count(*) from public.support_requests), 8);
select pg_temp.expect('program manager sees event registrations', (select count(*) from public.event_registrations), 10);
select pg_temp.expect('program manager sees no gifts', (select count(*) from public.donations), 0);
-- Adding a case note must succeed (this failed before migration 0016).
insert into public.support_request_notes (support_request_id, author_id, note) values ('da000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000003', 'Test note');
reset role;

-- Content editor: drafts allowed, publishing blocked, private data hidden.
select pg_temp.act_as('06');
select pg_temp.expect('content editor sees no cases', (select count(*) from public.support_requests), 0);
select pg_temp.expect_blocked('content editor cannot publish without review', $$update public.content_items set status = 'published', review_status = 'approved' where review_status = 'pending_review'$$);
select pg_temp.expect_blocked('content editor cannot change prices', $$update public.products set price = 1$$);
reset role;

-- Marketplace manager: products and orders, no gifts or cases.
select pg_temp.act_as('05');
select pg_temp.expect('shop manager sees orders', (select count(*) from public.orders), 3);
select pg_temp.expect('shop manager sees no gifts', (select count(*) from public.donations), 0);
update public.products set price = 2900 where slug = 'kiondo-market-basket';
reset role;

-- Finance: all gifts and orders; cannot change payment settings.
select pg_temp.act_as('04');
select pg_temp.expect('finance sees all gifts', (select count(*) from public.donations), 13);
select pg_temp.expect('finance sees no cases', (select count(*) from public.support_requests), 0);
select pg_temp.expect_blocked('finance cannot change payment settings', $$update public.giving_settings set mpesa_paybill = '999999' where id$$);
reset role;

-- Admin: everything operational, but not payment settings or secrets.
select pg_temp.act_as('02');
select pg_temp.expect('admin sees activity log', (select (count(*) > 0)::int from public.audit_logs), 1);
select pg_temp.expect_blocked('admin cannot change payment settings', $$update public.giving_settings set mpesa_paybill = '999999' where id$$);
select pg_temp.expect_blocked('admin cannot read payment secrets', $$select * from public.payment_provider_credentials$$);
reset role;

-- Super administrator: payment settings, with MFA only; secrets stay server-side.
select pg_temp.act_as('01', 'aal1');
select pg_temp.expect_blocked('superadmin without MFA cannot change payment settings', $$update public.giving_settings set mpesa_paybill = '999999' where id$$);
reset role;
select pg_temp.act_as('01');
update public.giving_settings set mpesa_paybill = '123456' where id;
select pg_temp.expect_blocked('even superadmin cannot read encrypted secrets from the browser', $$select * from public.payment_provider_credentials$$);
reset role;

-- Anonymous visitors: public content only.
do $$ begin perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('role', 'anon', true); end $$;
select pg_temp.expect('visitors see published programmes', (select count(*) from public.programs), 3);
select pg_temp.expect('visitors see approved impact figures', (select count(*) from public.public_impact_metrics), 4);
select pg_temp.expect_blocked('visitors cannot read support cases', $$select * from public.support_requests$$);
reset role;

rollback;
