-- Phase 7 visual governance: homepage visuals are managed through the approved media library.

alter table public.media_assets
  drop constraint if exists media_assets_entity_type_check;

alter table public.media_assets
  add constraint media_assets_entity_type_check
  check (entity_type in ('program', 'story', 'content_item', 'product', 'homepage'));

alter table public.media_assets
  add column if not exists placement text;

alter table public.media_assets
  drop constraint if exists media_assets_homepage_placement_check;

alter table public.media_assets
  add constraint media_assets_homepage_placement_check
  check (placement is null or placement in ('home_hero', 'home_story_main', 'home_story_support'));

create index if not exists media_assets_homepage_placement_idx
  on public.media_assets(entity_type, placement, status);
