-- Server-side moderation actions and report creation.
-- Keeps privileged role/status writes behind RPCs and prevents clients from
-- changing protected user fields through ordinary profile updates.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select u.role
      from public.users u
      where u.id = auth.uid()::text
        and u.status = 'active'
      limit 1
    ),
    'user'
  );
$$;

create or replace function public.current_user_is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('moderator', 'admin');
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

create or replace function public.prevent_unprivileged_user_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.uid() is null then
    return new;
  end if;

  actor_role := public.current_user_role();

  if new.role is distinct from old.role then
    if actor_role <> 'admin' then
      raise exception 'Only admins can change user roles.';
    end if;

    if old.id = auth.uid()::text and new.role <> old.role then
      raise exception 'Admins cannot change their own role.';
    end if;
  end if;

  if new.status is distinct from old.status
    or new.suspended_until is distinct from old.suspended_until
  then
    if actor_role not in ('moderator', 'admin') then
      raise exception 'Only moderators and admins can change account status.';
    end if;

    if old.role = 'admin' and actor_role <> 'admin' then
      raise exception 'Only admins can moderate admin accounts.';
    end if;

    if old.id = auth.uid()::text and new.status <> 'active' then
      raise exception 'Moderators cannot suspend or ban themselves.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists users_guard_protected_fields on public.users;
create trigger users_guard_protected_fields
before update on public.users
for each row
execute function public.prevent_unprivileged_user_guard_update();

create or replace function public.create_user_report(
  p_reported_user_id text,
  p_reason text,
  p_details text default null,
  p_circle_id text default null,
  p_message_id text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_report public.reports;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if nullif(trim(p_reported_user_id), '') is null then
    raise exception 'Reported user is required.';
  end if;

  if p_reported_user_id = auth.uid()::text then
    raise exception 'You cannot report yourself.';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'Report reason is required.';
  end if;

  if p_circle_id is not null and not exists (
    select 1
    from public.circles c
    where c.id::text = p_circle_id
      and (
        c.creator_id = auth.uid()::text
        or auth.uid()::text = any(c.members)
      )
      and (
        c.creator_id = p_reported_user_id
        or p_reported_user_id = any(c.members)
      )
  ) then
    raise exception 'You can only report members of a Circle you are in.';
  end if;

  insert into public.reports (
    reporter_id,
    reported_user_id,
    circle_id,
    message_id,
    reason,
    details,
    status,
    created_at
  )
  values (
    auth.uid()::text,
    p_reported_user_id,
    p_circle_id,
    p_message_id,
    trim(p_reason),
    nullif(trim(coalesce(p_details, '')), ''),
    'pending',
    now()
  )
  returning * into inserted_report;

  return inserted_report;
end;
$$;

create or replace function public.dismiss_report(
  p_report_id uuid,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_report public.reports;
begin
  if not public.current_user_is_moderator() then
    raise exception 'Moderator access required.';
  end if;

  update public.reports
  set
    status = 'dismissed',
    reviewed_by = auth.uid()::text,
    reviewed_at = now()
  where id = p_report_id
  returning * into reviewed_report;

  if reviewed_report.id is null then
    raise exception 'Report not found.';
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
    reviewed_report.reported_user_id,
    'report_dismissed',
    coalesce(nullif(trim(p_reason), ''), reviewed_report.reason),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'reportId', reviewed_report.id,
      'reportReason', reviewed_report.reason
    )
  );

  return reviewed_report;
end;
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

  select u.role into target_role
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

  update public.users
  set
    status = p_status,
    suspended_until = case
      when p_status = 'suspended' then p_suspended_until
      else null
    end
  where id = p_user_id
  returning * into updated_user;

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

  update public.users
  set role = p_role
  where id = p_user_id
  returning * into updated_user;

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
grant execute on function public.current_user_is_moderator() to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.create_user_report(text, text, text, text, text) to authenticated;
grant execute on function public.dismiss_report(uuid, text, jsonb) to authenticated;
grant execute on function public.moderate_user(text, text, timestamptz, text, uuid, jsonb) to authenticated;
grant execute on function public.set_user_role(text, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
