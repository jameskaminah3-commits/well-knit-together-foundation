-- Production content hygiene.
--
-- Earlier migrations seeded sample records for design review: a fictional
-- "Kisumu maker collective" (outside the registered counties) with recorded
-- consent, three products with third-party photographs, three events with
-- real-looking dates, and a placeholder fundraising campaign. On a live site
-- these read as real commitments to the public. This migration retires them
-- without deleting anything, so staff can review and republish deliberately.

-- Sample products: archive and drop hotlinked third-party imagery.
update public.products
set status = 'archived',
    image_url = null,
    image_credit = null,
    updated_at = timezone('utc', now())
where slug in ('woven-warmth-basket', 'indigo-table-runner', 'seed-bead-statement-necklace')
  and maker_profile_record_id = '00000000-0000-0000-0000-000000000061';

-- Sample maker profile: consent was never actually recorded.
update public.maker_profiles
set status = 'archived',
    consent_recorded = false,
    updated_at = timezone('utc', now())
where id = '00000000-0000-0000-0000-000000000061';

-- Sample events: archive so they cannot be registered for.
update public.engagement_events
set status = 'archived'
where id in (
  '00000000-0000-0000-0000-000000000071',
  '00000000-0000-0000-0000-000000000072',
  '00000000-0000-0000-0000-000000000073'
);

-- Placeholder campaign: return to draft only if it never received a gift.
update public.fundraising_campaigns
set status = 'draft'
where slug = 'care-capacity-opportunity-2026'
  and raised_amount = 0
  and not exists (
    select 1 from public.donations
    where donations.campaign_id = fundraising_campaigns.id
      and donations.status = 'succeeded'
  );

-- Events stayed hidden from the public as soon as registration closed, even
-- though they had not happened yet. Keep published (and cancelled) events
-- visible until 30 days after they end; registration is still enforced by
-- register_for_engagement_event().
drop policy if exists "published engagement events are public" on public.engagement_events;
create policy "published engagement events are public" on public.engagement_events
  for select to anon, authenticated
  using (
    status in ('published', 'cancelled')
    and coalesce(ends_at, starts_at) > timezone('utc', now()) - interval '30 days'
  );
