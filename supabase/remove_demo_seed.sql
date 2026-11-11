-- Removes everything created by supabase/seed.sql: the ten @demo.wellknit.test
-- accounts and every demo record. Run this on a staging project before it
-- becomes production. Real records are untouched: demo rows are matched by
-- their fixed demo ids or by belonging to a demo account.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/remove_demo_seed.sql

begin;

create temporary table demo_users on commit drop as
  select id from auth.users where email like '%@demo.wellknit.test';

-- Records that must go before the people who created them.
delete from public.support_request_events where support_request_id::text like 'da000000-%';
delete from public.support_request_notes where support_request_id::text like 'da000000-%' or author_id in (select id from demo_users);
delete from public.support_referrals where support_request_id::text like 'da000000-%' or created_by in (select id from demo_users);
delete from public.support_requests where id::text like 'da000000-%';
delete from public.support_export_requests where requested_by in (select id from demo_users);

delete from public.public_impact_metrics where id::text like 'dd100000-%';
delete from public.indicator_observation_history where observation_id in (select id from public.indicator_observations where id::text like 'dd000000-%' or entered_by in (select id from demo_users));
delete from public.reporting_quality_checks where observation_id in (select id from public.indicator_observations where id::text like 'dd000000-%' or entered_by in (select id from demo_users));
delete from public.indicator_observations where id::text like 'dd000000-%' or entered_by in (select id from demo_users);
delete from public.engagement_notifications where id::text like 'dd200000-%' or created_by in (select id from demo_users);

delete from public.event_attendance where registration_id::text like 'd4100000-%';
delete from public.event_registrations where id::text like 'd4100000-%' or event_id::text like 'd4000000-%';
delete from public.engagement_events where id::text like 'd4000000-%';

delete from public.partner_program_assignments where partner_application_id::text like 'db000000-%';
delete from public.partner_memberships where partner_application_id::text like 'db000000-%' or user_id in (select id from demo_users);
delete from public.partner_due_diligence where partner_application_id::text like 'db000000-%';
delete from public.partner_applications where id::text like 'db000000-%';
delete from public.volunteer_assignments where volunteer_application_id::text like 'dc000000-%';
delete from public.volunteer_applications where id::text like 'dc000000-%';

delete from public.payment_events where donation_id in (select id from public.donations where idempotency_key like 'demo-seed-gift-%');
delete from public.donations where idempotency_key like 'demo-seed-gift-%';
delete from public.fundraising_campaigns where id::text like 'd5000000-%';

delete from public.order_items where order_id::text like 'd9000000-%';
delete from public.orders where id::text like 'd9000000-%';
delete from public.inventory_reservations where product_id::text like 'd7000000-%';
delete from public.product_category_links where product_id::text like 'd7000000-%';
delete from public.order_items where product_id::text like 'd7000000-%';
delete from public.products where id::text like 'd7000000-%';
delete from public.maker_profiles where id::text like 'd8000000-%';

delete from public.content_localizations where entity_id::text like 'd2000000-%' or entity_id::text like 'd3000000-%' or created_by in (select id from demo_users);
delete from public.content_revisions where created_by in (select id from demo_users);
delete from public.stories where id::text like 'd2000000-%';
delete from public.content_items where id::text like 'd3000000-%';
delete from public.programs where slug = 'respite-care' and created_by in (select id from demo_users);

delete from public.site_feedback where message in (
  'The form in Kiswahili made it easy for my mother to ask for help herself.',
  'M-Pesa instructions were clear. Would love a receipt by SMS too.',
  'Beautiful baskets. Delivery to Nairobi took a week; please show delivery times.'
);
delete from public.email_messages where dedupe_key like 'demo:%' or recipient_user_id in (select id from demo_users);
delete from public.audit_logs where actor_id in (select id from demo_users);
delete from public.staff_invitations where invited_by in (select id from demo_users);

-- Demo giving details must never reach donors.
update public.giving_settings
set mpesa_paybill = null, mpesa_account_reference = null, bank_name = null, bank_account_name = null,
    bank_account_number = null, bank_branch = null, bank_swift = null, giving_note = null, online_checkout_enabled = false, updated_by = null
where mpesa_paybill = '174379' or giving_note like 'Demo environment%';

-- Program and story authorship by demo staff is cleared, not deleted: the
-- three starter programmes are the foundation's real programme areas.
update public.programs set image_path = null where image_path like '/demo/%';
update public.programs set created_by = null where created_by in (select id from demo_users);
update public.programs set reviewed_by = null where reviewed_by in (select id from demo_users);

delete from auth.identities where user_id in (select id from demo_users);
delete from auth.users where id in (select id from demo_users);

commit;
