-- Fix moderation RPC writes for projects where users.role / users.status are
-- enum-backed columns instead of plain text.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select u.role::text
      from public.users u
      where u.id = auth.uid()::text
        and u.status::text = 'active'
      limit 1
    ),
    'user'
  );
$$;

create or replace function public.moderate_user(
  p_user_id text,
  p_status text,
  p_suspended_until timestamptz default null,
  p_reason text default null,
  p_report_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  target_role text;
  status_column_type text;
  updated_user public.users;
  action_name text;
begin
  actor_role := public.current_user_role();

  if actor_role not in ('moderator', 'admin') then
    raise exception 'Moderator access required.';
  end if;

  if p_status not in ('active', 'suspended', 'banned') then
    raise exception 'Invalid moderation status.';
  end if;

  select u.role::text into target_role
  from public.users u
  where u.id = p_user_id;

  if target_role is null then
    raise exception 'User not found.';
  end if;

  if p_user_id = auth.uid()::text and p_status <> 'active' then
    raise exception 'Moderators cannot suspend or ban themselves.';
  end if;

  if target_role = 'admin' and actor_role <> 'admin' then
    raise exception 'Only admins can moderate admin accounts.';
  end if;

  select format_type(a.atttypid, a.atttypmod)
  into status_column_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'users'
    and a.attname = 'status'
    and not a.attisdropped;

  execute format(
    'update public.users
     set status = $1::%s,
         suspended_until = case when $1 = ''suspended'' then $2 else null end
     where id = $3
     returning *',
    status_column_type
  )
  using p_status, p_suspended_until, p_user_id
  into updated_user;

  action_name := case
    when p_status = 'active' then 'user_reactivated'
    when p_status = 'suspended' then 'user_suspended'
    else 'user_banned'
  end;

  if p_report_id is not null then
    update public.reports
    set
      status = 'resolved',
      reviewed_by = auth.uid()::text,
      reviewed_at = now()
    where id = p_report_id;
  end if;

  insert into public.moderation_logs (
    moderator_id,
    target_user_id,
    action,
    reason,
    metadata
  )
  values (
    auth.uid()::text,
    p_user_id,
    action_name,
    nullif(trim(coalesce(p_reason, '')), ''),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'reportId', p_report_id,
      'status', p_status,
      'suspendedUntil', p_suspended_until
    )
  );

  return updated_user;
end;
$$;

create or replace function public.set_user_role(
  p_user_id text,
  p_role text,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  role_column_type text;
  updated_user public.users;
begin
  if not public.current_user_is_admin() then
    raise exception 'Admin access required.';
  end if;

  if p_role not in ('user', 'moderator', 'admin') then
    raise exception 'Invalid user role.';
  end if;

  if p_user_id = auth.uid()::text then
    raise exception 'Admins cannot change their own role.';
  end if;

  select format_type(a.atttypid, a.atttypmod)
  into role_column_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'users'
    and a.attname = 'role'
    and not a.attisdropped;

  execute format(
    'update public.users
     set role = $1::%s
     where id = $2
     returning *',
    role_column_type
  )
  using p_role, p_user_id
  into updated_user;

  if updated_user.id is null then
    raise exception 'User not found.';
  end if;

  insert into public.moderation_logs (
    moderator_id,
    target_user_id,
    action,
    reason,
    metadata
  )
  values (
    auth.uid()::text,
    p_user_id,
    'role_updated',
    nullif(trim(coalesce(p_reason, '')), ''),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('role', p_role)
  );

  return updated_user;
end;
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.moderate_user(text, text, timestamptz, text, uuid, jsonb) to authenticated;
grant execute on function public.set_user_role(text, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
