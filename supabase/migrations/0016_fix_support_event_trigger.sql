-- Fix: adding a case note always failed.
--
-- log_support_related_event() is shared by support_request_notes and
-- support_referrals. It read new.partner_name inside a CASE expression, and
-- PL/pgSQL resolves every field reference in an expression before evaluating
-- it, so inserting a note raised "record new has no field partner_name" and
-- rolled back the note. Branch with IF so each table only touches its own
-- columns.

create or replace function public.log_support_related_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'support_request_notes' then
    insert into public.support_request_events (support_request_id, actor_id, event_type, metadata)
    values (new.support_request_id, auth.uid(), 'note_added', jsonb_build_object('note_id', new.id));
  else
    insert into public.support_request_events (support_request_id, actor_id, event_type, metadata)
    values (new.support_request_id, auth.uid(), 'referral_added', jsonb_build_object('referral_id', new.id, 'partner_name', to_jsonb(new) ->> 'partner_name'));
  end if;
  return new;
end;
$$;
