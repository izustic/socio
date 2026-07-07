-- Track limited early exits from Circles.

alter table public.users
add column if not exists free_exits integer not null default 2;

alter table public.users
drop constraint if exists valid_free_exits;

alter table public.users
add constraint valid_free_exits check (free_exits between 0 and 2);

update public.users
set free_exits = 2
where free_exits is null;

create or replace function public.reset_circle_free_exits_if_expired(p_circle_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_circle public.circles%rowtype;
  v_deadline timestamptz;
begin
  select *
  into v_circle
  from public.circles
  where id::text = p_circle_id;

  if not found then
    return false;
  end if;

  v_deadline := coalesce(
    v_circle.meetup_deadline,
    v_circle.created_at + (v_circle.meetup_days || ' days')::interval
  );

  if v_deadline > now() then
    return false;
  end if;

  update public.users
  set free_exits = 2
  where id = any (v_circle.members);

  return true;
end;
$$;

create or replace function public.leave_circle(p_circle_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_circle public.circles%rowtype;
  v_deadline timestamptz;
  v_deadline_elapsed boolean;
  v_free_exits integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to leave a Circle';
  end if;

  select *
  into v_circle
  from public.circles
  where id::text = p_circle_id
  for update;

  if not found then
    raise exception 'Circle not found';
  end if;

  if auth.uid()::text <> any (v_circle.members) then
    raise exception 'You are not a member of this Circle';
  end if;

  if v_circle.creator_id::text = auth.uid()::text then
    raise exception 'Hosts must close their Circle instead';
  end if;

  v_deadline := coalesce(
    v_circle.meetup_deadline,
    v_circle.created_at + (v_circle.meetup_days || ' days')::interval
  );
  v_deadline_elapsed := v_deadline <= now();

  if v_deadline_elapsed then
    update public.users
    set free_exits = 2
    where id = any (v_circle.members);
  else
    select free_exits
    into v_free_exits
    from public.users
    where id = auth.uid()::text
    for update;

    if coalesce(v_free_exits, 0) <= 0 then
      raise exception 'You have used your free exits. You can leave once this Circle''s time is up.';
    end if;

    update public.users
    set free_exits = greatest(free_exits - 1, 0)
    where id = auth.uid()::text;
  end if;

  update public.circles
  set members = array_remove(members, auth.uid()::text)
  where id::text = p_circle_id;
end;
$$;

create or replace function public.close_circle(p_circle_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_circle public.circles%rowtype;
  v_deadline timestamptz;
  v_deadline_elapsed boolean;
  v_free_exits integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to close a Circle';
  end if;

  select *
  into v_circle
  from public.circles
  where id::text = p_circle_id
  for update;

  if not found then
    raise exception 'Circle not found';
  end if;

  if v_circle.creator_id::text <> auth.uid()::text then
    raise exception 'Only the host can close this Circle';
  end if;

  v_deadline := coalesce(
    v_circle.meetup_deadline,
    v_circle.created_at + (v_circle.meetup_days || ' days')::interval
  );
  v_deadline_elapsed := v_deadline <= now();

  if v_deadline_elapsed then
    update public.users
    set free_exits = 2
    where id = any (v_circle.members);
  else
    select free_exits
    into v_free_exits
    from public.users
    where id = auth.uid()::text
    for update;

    if coalesce(v_free_exits, 0) <= 0 then
      raise exception 'You have used your free exits. You can close once this Circle''s time is up.';
    end if;

    update public.users
    set free_exits = greatest(free_exits - 1, 0)
    where id = auth.uid()::text;
  end if;

  delete from public.messages
  where circle_id::text = p_circle_id;

  delete from public.circle_pending
  where circle_id::text = p_circle_id;

  delete from public.polls
  where circle_id::text = p_circle_id;

  delete from public.circles
  where id::text = p_circle_id;
end;
$$;

grant execute on function public.reset_circle_free_exits_if_expired(text) to authenticated;
grant execute on function public.leave_circle(text) to authenticated;
grant execute on function public.close_circle(text) to authenticated;

notify pgrst, 'reload schema';
