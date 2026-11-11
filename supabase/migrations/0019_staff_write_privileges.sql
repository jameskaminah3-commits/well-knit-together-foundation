-- Staff workspaces could not save their work.
--
-- Earlier migrations created row-level security policies that allow verified
-- staff to manage these tables, but never granted the matching table
-- privileges, so every save failed with "permission denied". Found by signing
-- in as each role in a browser:
--   - content editors could not create or edit programmes or stories, and
--     administrators could not approve them;
--   - programme staff could not approve or decline partner and volunteer
--     applications;
--   - engagement staff could not create or update events or registrations.
-- Policies still decide who may write; DELETE stays ungranted on purpose
-- (records are archived, not deleted).

grant insert, update on public.programs to authenticated;
grant insert, update on public.stories to authenticated;
grant update on public.partner_applications to authenticated;
grant update on public.volunteer_applications to authenticated;
grant insert, update on public.engagement_events to authenticated;
grant update on public.event_registrations to authenticated;
