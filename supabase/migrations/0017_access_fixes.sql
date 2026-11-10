-- Access fixes found during the role-by-role dashboard audit.

-- 1. Event registrations and attendance were unreadable for every role,
--    including engagement staff. The "own registration" policies looked up the
--    user's email in auth.users, which the authenticated role cannot read, so
--    evaluating the policy raised "permission denied for table users" and the
--    whole query failed. Use the email claim from the verified JWT instead.
drop policy if exists "users can view own event registrations" on public.event_registrations;
create policy "users can view own event registrations" on public.event_registrations
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

drop policy if exists "registrants view own attendance" on public.event_attendance;
create policy "registrants view own attendance" on public.event_attendance
  for select to authenticated
  using (
    exists (
      select 1 from public.event_registrations registration
      where registration.id = event_attendance.registration_id
        and (
          registration.user_id = (select auth.uid())
          or lower(registration.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
        )
    )
  );

-- 2. Audit entries written from staff sessions (metric approvals, application
--    reviews, due diligence) were silently rejected: authenticated users had no
--    insert privilege. Allow verified staff to append entries attributed to
--    themselves only. Entries cannot be edited or deleted.
grant insert on public.audit_logs to authenticated;
drop policy if exists "staff append own audit entries" on public.audit_logs;
create policy "staff append own audit entries" on public.audit_logs
  for insert to authenticated
  with check (actor_id = (select auth.uid()) and public.is_staff());

-- 3. The super administrator could not read or triage site feedback.
drop policy if exists "staff can review feedback" on public.site_feedback;
create policy "staff can review feedback" on public.site_feedback
  for select to authenticated
  using (public.has_staff_access('superadmin') or public.has_staff_access('admin') or public.has_staff_access('program_manager'));

drop policy if exists "staff can update feedback" on public.site_feedback;
create policy "staff can update feedback" on public.site_feedback
  for update to authenticated
  using (public.has_staff_access('superadmin') or public.has_staff_access('admin') or public.has_staff_access('program_manager'))
  with check (public.has_staff_access('superadmin') or public.has_staff_access('admin') or public.has_staff_access('program_manager'));

-- 4. Let verified administrators read the audit trail (the policy existed but
--    the privilege was never granted), so the admin workspace can show it.
grant select on public.audit_logs to authenticated;
