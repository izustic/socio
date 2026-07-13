-- Make expired Circle resets idempotent and serialize concurrent callers.

create or replace function public.reset_circle_free_exits_if_expired(p_circle_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_circle public.circles%rowtype;
  v_deadline timestamptz;
  v_updated_count integer := 0;
begin
  -- Serializes resets with other operations on this Circle, including leave/close.
  select *
  into v_circle
  from public.circles
  where id::text = p_circle_id
  for update;

  if not found then
    return false;
  end if;

  if auth.uid() is null or auth.uid()::text <> all (v_circle.members) then
    return false;
  end if;

  v_deadline := coalesce(
    v_circle.meetup_deadline,
    v_circle.created_at + (v_circle.meetup_days || ' days')::interval
  );

  if v_deadline > now() then
    return false;
  end if;

  -- Acquire member locks in a deterministic order. This prevents two expired
  -- Circles with overlapping membership from locking users in opposite orders.
  perform 1
  from public.users
  where id = any (v_circle.members)
  order by id
  for update;

  update public.users
  set free_exits = 2
  where id = any (v_circle.members)
    and free_exits is distinct from 2;

  get diagnostics v_updated_count = row_count;
  return v_updated_count > 0;
end;
$$;

grant execute on function public.reset_circle_free_exits_if_expired(text) to authenticated;

notify pgrst, 'reload schema';
