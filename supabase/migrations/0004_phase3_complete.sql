-- Phase 3 completion: media, review workflows, additional content, localisation, and SEO metadata.

alter table public.programs
  add column if not exists review_status text not null default 'approved'
    check (review_status in ('draft', 'pending_review', 'approved', 'rejected')),
  add column if not exists default_language text not null default 'en'
    check (default_language in ('en', 'sw'));

alter table public.stories
  add column if not exists review_status text not null default 'draft'
    check (review_status in ('draft', 'pending_review', 'approved', 'rejected')),
  add column if not exists default_language text not null default 'en'
    check (default_language in ('en', 'sw'));

alter table public.content_revisions
  drop constraint if exists content_revisions_entity_type_check;
alter table public.content_revisions
  add constraint content_revisions_entity_type_check
  check (entity_type in ('program', 'story', 'content_item'));

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('news', 'event', 'report', 'resource')),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  status public.publication_status not null default 'draft',
  review_status text not null default 'draft' check (review_status in ('draft', 'pending_review', 'approved', 'rejected')),
  default_language text not null default 'en' check (default_language in ('en', 'sw')),
  image_path text,
  file_path text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  scheduled_for timestamptz,
  seo_title text,
  seo_description text,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists content_items_type_status_idx on public.content_items(content_type, status, review_status);
create index if not exists content_items_schedule_idx on public.content_items(scheduled_for);

create table if not exists public.content_localizations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('program', 'story', 'content_item')),
  entity_id uuid not null,
  language text not null check (language in ('en', 'sw')),
  title text not null,
  summary text,
  body text,
  seo_title text,
  seo_description text,
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (entity_type, entity_id, language)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null check (bucket_id in ('public-media', 'private-media')),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 5242880),
  alt_text text not null,
  consent_recorded boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  entity_type text check (entity_type in ('program', 'story', 'content_item', 'product')),
  entity_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists media_assets_entity_idx on public.media_assets(entity_type, entity_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-media', 'public-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-media', 'private-media', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter table public.content_items enable row level security;
alter table public.content_localizations enable row level security;
alter table public.media_assets enable row level security;

revoke all on public.content_items, public.content_localizations, public.media_assets from anon, authenticated;
grant select on public.content_items to anon, authenticated;
grant select, insert, update on public.content_items, public.content_localizations, public.media_assets to authenticated;

create or replace function public.has_admin_access()
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
        and role in ('superadmin', 'admin')
    );
$$;

drop policy if exists "published programs are public" on public.programs;
create policy "published programs are public" on public.programs
  for select to anon, authenticated
  using (status = 'published' and review_status = 'approved' and (scheduled_for is null or scheduled_for <= timezone('utc', now())));

drop policy if exists "content staff manage programs" on public.programs;
create policy "content staff manage programs" on public.programs
  for all to authenticated
  using (public.has_content_access())
  with check (public.has_content_access() and (status <> 'published' or (review_status = 'approved' and public.has_admin_access())));

drop policy if exists "published stories are public" on public.stories;
create policy "published stories are public" on public.stories
  for select to anon, authenticated
  using (status = 'published' and review_status = 'approved' and consent_recorded = true and (scheduled_for is null or scheduled_for <= timezone('utc', now())));

drop policy if exists "content staff manage stories" on public.stories;
create policy "content staff manage stories" on public.stories
  for all to authenticated
  using (public.has_content_access())
  with check (public.has_content_access() and (status <> 'published' or (review_status = 'approved' and public.has_admin_access())));

create policy "published content items are public" on public.content_items
  for select to anon, authenticated
  using (status = 'published' and review_status = 'approved' and (scheduled_for is null or scheduled_for <= timezone('utc', now())));

create policy "content staff manage content items" on public.content_items
  for all to authenticated
  using (public.has_content_access())
  with check (public.has_content_access() and (status <> 'published' or (review_status = 'approved' and public.has_admin_access())));

create policy "content staff view localizations" on public.content_localizations
  for select to authenticated using (public.has_content_access());
create policy "content staff create localizations" on public.content_localizations
  for insert to authenticated with check (public.has_content_access() and created_by = (select auth.uid()));
create policy "content staff update localizations" on public.content_localizations
  for update to authenticated using (public.has_content_access()) with check (public.has_content_access());

create policy "approved media metadata is public" on public.media_assets
  for select to anon, authenticated
  using (bucket_id = 'public-media' and status = 'approved' and consent_recorded = true);
create policy "content staff view media metadata" on public.media_assets
  for select to authenticated using (public.has_content_access());
create policy "content staff create media metadata" on public.media_assets
  for insert to authenticated with check (public.has_content_access() and created_by = (select auth.uid()));
create policy "content staff update media metadata" on public.media_assets
  for update to authenticated using (public.has_content_access()) with check (public.has_content_access());

drop policy if exists "content staff upload media" on storage.objects;
create policy "content staff upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('public-media', 'private-media') and public.has_content_access());
drop policy if exists "content staff manage media" on storage.objects;
create policy "content staff manage media" on storage.objects
  for all to authenticated
  using (bucket_id in ('public-media', 'private-media') and public.has_content_access())
  with check (bucket_id in ('public-media', 'private-media') and public.has_content_access());

drop policy if exists "content staff view private media" on storage.objects;
create policy "content staff view private media" on storage.objects
  for select to authenticated
  using (bucket_id = 'private-media' and public.has_content_access());

drop trigger if exists content_items_touch_updated_at on public.content_items;
create trigger content_items_touch_updated_at before update on public.content_items for each row execute procedure public.touch_updated_at();
drop trigger if exists content_localizations_touch_updated_at on public.content_localizations;
create trigger content_localizations_touch_updated_at before update on public.content_localizations for each row execute procedure public.touch_updated_at();
drop trigger if exists media_assets_touch_updated_at on public.media_assets;
create trigger media_assets_touch_updated_at before update on public.media_assets for each row execute procedure public.touch_updated_at();
