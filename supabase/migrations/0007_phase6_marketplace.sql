-- Phase 6: marketplace catalogue, privacy-safe maker stories, and checkout intents.

create table if not exists public.maker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  story text not null,
  county text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'paused', 'archived')),
  consent_recorded boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_category_links (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.product_categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  sort_order integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  consent_recorded boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists category_slug text not null default 'home';
alter table public.products add column if not exists impact_note text;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists reserved_quantity integer not null default 0 check (reserved_quantity >= 0);
alter table public.products add column if not exists maker_profile_record_id uuid references public.maker_profiles(id) on delete set null;

alter table public.orders add column if not exists checkout_session_id text unique;
alter table public.orders add column if not exists fulfilment_note text;

alter table public.order_items add column if not exists product_name_snapshot text;
alter table public.order_items add column if not exists line_total numeric(12, 2);

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status text not null default 'reserved' check (status in ('reserved', 'released', 'consumed')),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '30 minutes'),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists maker_profiles_status_idx on public.maker_profiles(status);
create index if not exists product_categories_status_idx on public.product_categories(status);
create index if not exists product_category_links_category_idx on public.product_category_links(category_id);
create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);
create index if not exists inventory_reservations_order_idx on public.inventory_reservations(order_id);
create index if not exists inventory_reservations_product_idx on public.inventory_reservations(product_id, status);

alter table public.maker_profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_category_links enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_reservations enable row level security;

revoke all on public.maker_profiles, public.product_categories, public.product_category_links, public.product_images, public.inventory_reservations from anon;
revoke all on public.maker_profiles, public.product_categories, public.product_category_links, public.product_images, public.inventory_reservations from authenticated;
grant select on public.maker_profiles, public.product_categories, public.product_category_links, public.product_images to anon, authenticated;
grant select, update on public.orders to authenticated;

drop policy if exists "active products are public" on public.products;
create policy "active products are public" on public.products
  for select to anon, authenticated
  using (status = 'active');

drop policy if exists "approved maker profiles are public" on public.maker_profiles;
create policy "approved maker profiles are public" on public.maker_profiles
  for select to anon, authenticated
  using (status = 'approved' and consent_recorded = true);

create policy "active product categories are public" on public.product_categories
  for select to anon, authenticated
  using (status = 'active');

create policy "active product category links are public" on public.product_category_links
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  ));

create policy "approved product images are public" on public.product_images
  for select to anon, authenticated
  using (status = 'approved' and consent_recorded = true and exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  ));

create policy "marketplace staff update orders" on public.orders
  for update to authenticated
  using (public.has_staff_access('marketplace_manager') or public.has_staff_access('finance') or public.has_staff_access('superadmin') or public.has_staff_access('admin'))
  with check (public.has_staff_access('marketplace_manager') or public.has_staff_access('finance') or public.has_staff_access('superadmin') or public.has_staff_access('admin'));

create or replace function public.create_marketplace_order(
  p_items jsonb,
  p_shipping_details jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  customer_email_value text;
  order_id_value uuid := gen_random_uuid();
  item jsonb;
  product_row record;
  product_id_value uuid;
  quantity_value integer;
  total_value numeric(12, 2) := 0;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'at least one product is required';
  end if;

  select email into customer_email_value from auth.users where id = current_user_id;
  if customer_email_value is null then
    raise exception 'customer email is required';
  end if;

  insert into public.orders (id, customer_id, customer_email, status, total_amount, currency, shipping_details)
  values (order_id_value, current_user_id, customer_email_value, 'pending', 0, 'KES', coalesce(p_shipping_details, '{}'::jsonb));

  for item in select value from jsonb_array_elements(p_items) loop
    product_id_value := (item ->> 'product_id')::uuid;
    quantity_value := (item ->> 'quantity')::integer;

    if quantity_value is null or quantity_value < 1 or quantity_value > 20 then
      raise exception 'invalid product quantity';
    end if;

    select id, name, price, currency, stock_quantity, reserved_quantity
      into product_row
      from public.products
      where id = product_id_value and status = 'active'
      for update;

    if not found then
      raise exception 'product is not available';
    end if;

    if product_row.stock_quantity - product_row.reserved_quantity < quantity_value then
      raise exception 'product is temporarily out of stock';
    end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price, product_name_snapshot, line_total)
    values (
      order_id_value,
      product_row.id,
      quantity_value,
      product_row.price,
      product_row.name,
      product_row.price * quantity_value
    );

    insert into public.inventory_reservations (order_id, product_id, quantity)
    values (order_id_value, product_row.id, quantity_value);

    update public.products
      set reserved_quantity = reserved_quantity + quantity_value,
          updated_at = timezone('utc', now())
      where id = product_row.id;

    total_value := total_value + (product_row.price * quantity_value);
  end loop;

  update public.orders
    set total_amount = total_value,
        updated_at = timezone('utc', now())
    where id = order_id_value;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (current_user_id, 'marketplace.order_created', 'order', order_id_value, jsonb_build_object('total_amount', total_value));

  return order_id_value;
end;
$$;

revoke all on function public.create_marketplace_order(jsonb, jsonb) from public;
grant execute on function public.create_marketplace_order(jsonb, jsonb) to authenticated;

insert into public.maker_profiles (id, display_name, story, county, status, consent_recorded)
values (
  '00000000-0000-0000-0000-000000000061',
  'Kisumu maker collective',
  'A sample cooperative turning careful hands, shared skills, and locally sourced materials into useful pieces for everyday life.',
  'Kisumu',
  'approved',
  true
)
on conflict (id) do update set
  display_name = excluded.display_name,
  story = excluded.story,
  county = excluded.county,
  status = excluded.status,
  consent_recorded = excluded.consent_recorded;

insert into public.product_categories (slug, name, description, sort_order)
values
  ('home', 'Home and living', 'Warm, useful pieces for the spaces where people gather.', 1),
  ('wearables', 'Wearables', 'Small-batch pieces made to be carried, worn, and kept.', 2),
  ('gifts', 'Gifts with meaning', 'Thoughtful objects that connect a purchase to opportunity.', 3)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  status = 'active';

insert into public.products (
  slug, name, description, short_description, maker_story, impact_note, price, currency,
  stock_quantity, status, category_slug, featured, maker_profile_record_id
)
values
  (
    'woven-warmth-basket',
    'Woven warmth basket',
    'A structured handwoven basket with a quiet, natural finish for keeping everyday essentials close.',
    'A considered basket for the rhythm of everyday life.',
    'Made by the Kisumu maker collective, where shared production helps women build confidence, income, and room to plan ahead.',
    'Every purchase contributes to dependable market access and maker income.',
    3200, 'KES', 12, 'active', 'home', true, '00000000-0000-0000-0000-000000000061'
  ),
  (
    'indigo-table-runner',
    'Indigo table runner',
    'A hand-finished runner in deep indigo and soft natural tones, designed to settle beautifully into a shared table.',
    'A slow-made layer for shared meals and meaningful rooms.',
    'The collective’s textile work creates a place to learn, make, and earn together without reducing makers to a single story.',
    'Sales support skills, materials, and fairer routes to market.',
    2800, 'KES', 9, 'active', 'home', true, '00000000-0000-0000-0000-000000000061'
  ),
  (
    'seed-bead-statement-necklace',
    'Seed bead statement necklace',
    'A light, graphic necklace made in a small palette of warm earth and green tones.',
    'A small statement with a generous connection behind it.',
    'Each piece is made in small batches, giving the collective space to protect quality and grow at a humane pace.',
    'Your order helps keep creative work visible, valued, and connected to customers.',
    1800, 'KES', 18, 'active', 'wearables', false, '00000000-0000-0000-0000-000000000061'
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  short_description = excluded.short_description,
  maker_story = excluded.maker_story,
  impact_note = excluded.impact_note,
  price = excluded.price,
  currency = excluded.currency,
  stock_quantity = excluded.stock_quantity,
  status = excluded.status,
  category_slug = excluded.category_slug,
  featured = excluded.featured,
  maker_profile_record_id = excluded.maker_profile_record_id;

insert into public.product_category_links (product_id, category_id)
select p.id, c.id
from public.products p
join public.product_categories c on c.slug = p.category_slug
where p.slug in ('woven-warmth-basket', 'indigo-table-runner', 'seed-bead-statement-necklace')
on conflict do nothing;
