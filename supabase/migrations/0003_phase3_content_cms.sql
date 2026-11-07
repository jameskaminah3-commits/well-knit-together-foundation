-- Phase 3 content foundation: editorial metadata, revisions, and safe publication rules.

alter table public.programs
  add column if not exists image_path text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.stories
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('program', 'story')),
  entity_id uuid not null,
  version integer not null check (version > 0),
  content jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (entity_type, entity_id, version)
);

create index content_revisions_entity_idx on public.content_revisions(entity_type, entity_id, created_at desc);

alter table public.content_revisions enable row level security;
revoke all on public.content_revisions from anon, authenticated;
grant select, insert on public.content_revisions to authenticated;

create or replace function public.has_content_access()
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
        and role in ('content_editor', 'superadmin', 'admin')
    );
$$;

drop policy if exists "published programs are public" on public.programs;
create policy "published programs are public" on public.programs
  for select to anon, authenticated
  using (status = 'published' and (scheduled_for is null or scheduled_for <= timezone('utc', now())));

drop policy if exists "staff manage programs" on public.programs;
create policy "content staff manage programs" on public.programs
  for all to authenticated using (public.has_content_access()) with check (public.has_content_access());

drop policy if exists "published stories are public" on public.stories;
create policy "published stories are public" on public.stories
  for select to anon, authenticated
  using (status = 'published' and consent_recorded = true and (scheduled_for is null or scheduled_for <= timezone('utc', now())));

drop policy if exists "staff manage stories" on public.stories;
create policy "content staff manage stories" on public.stories
  for all to authenticated using (public.has_content_access()) with check (public.has_content_access());

create policy "content staff view revisions" on public.content_revisions
  for select to authenticated using (public.has_content_access());

create policy "content staff create revisions" on public.content_revisions
  for insert to authenticated
  with check (public.has_content_access() and created_by = (select auth.uid()));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists programs_touch_updated_at on public.programs;
create trigger programs_touch_updated_at before update on public.programs for each row execute procedure public.touch_updated_at();

drop trigger if exists stories_touch_updated_at on public.stories;
create trigger stories_touch_updated_at before update on public.stories for each row execute procedure public.touch_updated_at();
