-- Allow clients to create in-app notifications for swipes, chat, and
-- circle progress events. The previous policy relied on
-- `auth.uid() is not null`, which can be rejected in some environments
-- (e.g. role-restricted clients) and was being tripped as
-- `42501 insufficient_privilege` when a joiner notified a host after
-- a swipe. Centralizing inserts behind a SECURITY DEFINER function
-- gives the same effect for all swipers (joiner + host) and matches the
-- pattern used for moderation notifications.

create or replace function public.create_app_notification(
  p_user_id text,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id text;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if p_user_id is null or length(p_user_id) = 0 then
    raise exception 'user_id is required';
  end if;

  -- The notifications.type column is the public.notification_type enum.
  -- Casting here keeps the RPC signature as plain text (so the client
  -- does not need to know the enum type) while still satisfying the
  -- strongly-typed column.
  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    data
  )
  values (
    p_user_id,
    p_type::public.notification_type,
    p_title,
    p_body,
    p_data
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_app_notification(text, text, text, text, jsonb) from public;
grant execute on function public.create_app_notification(text, text, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
