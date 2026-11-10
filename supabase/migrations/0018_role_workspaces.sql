-- Privileges for role workspaces found missing in the dashboard audit.

-- Marketplace managers had a policy allowing them to manage products but no
-- table privilege, so every product edit failed with "permission denied".
grant insert, update on public.products to authenticated;

-- Partners could see referrals assigned to their organisation but had no way
-- to accept, decline, or complete them. A narrow function lets an active
-- partner member update only the status and outcome of their own referrals.
create or replace function public.partner_update_referral(p_referral_id uuid, p_status text, p_outcome text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_row record;
begin
  if p_status not in ('accepted', 'declined', 'completed') then
    raise exception 'unsupported referral status';
  end if;
  if p_outcome is not null and char_length(p_outcome) > 1000 then
    raise exception 'outcome is too long';
  end if;

  select referral.id, referral.partner_application_id, referral.referral_status, referral.support_request_id
  into referral_row
  from public.support_referrals referral
  where referral.id = p_referral_id
    and exists (
      select 1 from public.partner_memberships membership
      where membership.partner_application_id = referral.partner_application_id
        and membership.user_id = (select auth.uid())
        and membership.membership_status = 'active'
    )
  for update;

  if not found then
    raise exception 'referral not found';
  end if;
  if referral_row.referral_status in ('completed', 'cancelled') then
    raise exception 'this referral is already closed';
  end if;

  update public.support_referrals
  set referral_status = p_status,
      outcome = coalesce(nullif(trim(p_outcome), ''), outcome),
      updated_at = timezone('utc', now())
  where id = p_referral_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), 'partner_referral_updated', 'support_referral', p_referral_id, jsonb_build_object('status', p_status));

  return p_status;
end;
$$;

revoke all on function public.partner_update_referral(uuid, text, text) from public;
grant execute on function public.partner_update_referral(uuid, text, text) to authenticated;

-- Orders reserved stock at checkout but nothing ever consumed or released the
-- reservation, so products drifted towards "sold out" as orders were fulfilled
-- or cancelled. Moving an order through this function keeps stock honest:
-- paid/processing/fulfilled consume the reservation (stock leaves the shelf);
-- cancelled/refunded release it.
create or replace function public.set_marketplace_order_status(p_order_id uuid, p_status public.order_status, p_note text)
returns public.order_status
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.order_status;
  reservation record;
begin
  if not (public.has_staff_access('marketplace_manager') or public.has_staff_access('finance') or public.has_staff_access('admin') or public.has_staff_access('superadmin')) then
    raise exception 'verified marketplace or finance access required';
  end if;

  select status into current_status from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if current_status in ('fulfilled', 'cancelled', 'refunded') and p_status <> 'refunded' then
    raise exception 'this order is already closed';
  end if;

  for reservation in
    select id, product_id, quantity from public.inventory_reservations
    where order_id = p_order_id and status = 'reserved'
    for update
  loop
    if p_status in ('paid', 'processing', 'fulfilled') then
      update public.products
      set stock_quantity = greatest(stock_quantity - reservation.quantity, 0),
          reserved_quantity = greatest(reserved_quantity - reservation.quantity, 0),
          updated_at = timezone('utc', now())
      where id = reservation.product_id;
      update public.inventory_reservations set status = 'consumed' where id = reservation.id;
    elsif p_status in ('cancelled', 'refunded') then
      update public.products
      set reserved_quantity = greatest(reserved_quantity - reservation.quantity, 0),
          updated_at = timezone('utc', now())
      where id = reservation.product_id;
      update public.inventory_reservations set status = 'released' where id = reservation.id;
    end if;
  end loop;

  update public.orders
  set status = p_status,
      fulfilment_note = coalesce(nullif(trim(p_note), ''), fulfilment_note),
      updated_at = timezone('utc', now())
  where id = p_order_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), 'order_status_changed', 'order', p_order_id, jsonb_build_object('from', current_status, 'to', p_status));
  return p_status;
end;
$$;

revoke all on function public.set_marketplace_order_status(uuid, public.order_status, text) from public;
grant execute on function public.set_marketplace_order_status(uuid, public.order_status, text) to authenticated;
