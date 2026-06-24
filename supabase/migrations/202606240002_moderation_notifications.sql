-- Server-side notifications for moderation events.
-- Keeps moderation alerting out of client code so the app cannot fabricate
-- or skip moderation notifications from the UI.

create or replace function public.notify_moderation_report_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reporter_name text;
begin
  select coalesce(display_name, split_part(email, '@', 1), 'Someone')
  into reporter_name
  from public.users
  where id = new.reporter_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    data
  )
  select
    u.id,
    'system',
    'New report pending review',
    coalesce(reporter_name, 'Someone') || ' filed a report that needs review.',
    jsonb_build_object(
      'action', 'review_report',
      'reportId', new.id,
      'reportedUserId', new.reported_user_id,
      'reporterId', new.reporter_id,
      'circleId', new.circle_id,
      'messageId', new.message_id
    )
  from public.users u
  where u.role in ('moderator', 'admin')
    and u.status = 'active'
    and u.id <> new.reporter_id;

  return new;
end;
$$;

drop trigger if exists moderation_reports_notify_on_insert on public.reports;
create trigger moderation_reports_notify_on_insert
after insert on public.reports
for each row
execute function public.notify_moderation_report_created();

create or replace function public.notify_moderation_report_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reported_name text;
  reviewer_name text;
begin
  if new.status not in ('resolved', 'dismissed') then
    return new;
  end if;

  if new.reporter_id is null then
    return new;
  end if;

  select coalesce(display_name, split_part(email, '@', 1), 'Someone')
  into reported_name
  from public.users
  where id = new.reported_user_id;

  select coalesce(display_name, split_part(email, '@', 1), 'Moderator')
  into reviewer_name
  from public.users
  where id = new.reviewed_by;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    data
  ) values (
    new.reporter_id,
    'system',
    case
      when new.status = 'resolved' then 'Report resolved'
      else 'Report dismissed'
    end,
    case
      when new.status = 'resolved'
        then coalesce(reviewer_name, 'A moderator') || ' reviewed your report about ' || coalesce(reported_name, 'the account') || '.'
      else 'Your report about ' || coalesce(reported_name, 'the account') || ' was dismissed.'
    end,
    jsonb_build_object(
      'action',
      case
        when new.status = 'resolved' then 'report_resolved'
        else 'report_dismissed'
      end,
      'reportId', new.id,
      'reportedUserId', new.reported_user_id,
      'reviewedBy', new.reviewed_by,
      'reviewedAt', new.reviewed_at,
      'status', new.status
    )
  );

  return new;
end;
$$;

drop trigger if exists moderation_reports_notify_on_update on public.reports;
create trigger moderation_reports_notify_on_update
after update of status, reviewed_by, reviewed_at on public.reports
for each row
when (new.status in ('resolved', 'dismissed'))
execute function public.notify_moderation_report_reviewed();

create or replace function public.notify_moderation_log_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_name text;
begin
  if new.target_user_id is null then
    return new;
  end if;

  if new.action not in ('user_banned', 'user_suspended', 'user_reactivated', 'role_updated') then
    return new;
  end if;

  select coalesce(display_name, split_part(email, '@', 1), 'Someone')
  into target_name
  from public.users
  where id = new.target_user_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    data
  ) values (
    new.target_user_id,
    'system',
    case new.action
      when 'user_banned' then 'Account banned'
      when 'user_suspended' then 'Account suspended'
      when 'user_reactivated' then 'Account restored'
      when 'role_updated' then 'Role updated'
      else 'Account updated'
    end,
    case new.action
      when 'user_banned' then 'Hi ' || coalesce(target_name, 'there') || ', your account was banned by moderation.'
      when 'user_suspended' then 'Hi ' || coalesce(target_name, 'there') || ', your account was suspended by moderation.'
      when 'user_reactivated' then 'Hi ' || coalesce(target_name, 'there') || ', your account was reactivated.'
      when 'role_updated' then 'Hi ' || coalesce(target_name, 'there') || ', your account role was updated.'
      else 'Hi ' || coalesce(target_name, 'there') || ', your account was updated by moderation.'
    end,
    jsonb_build_object(
      'action', new.action,
      'logId', new.id,
      'targetUserId', new.target_user_id,
      'moderatorId', new.moderator_id,
      'reason', new.reason,
      'metadata', new.metadata
    )
  );

  return new;
end;
$$;

drop trigger if exists moderation_logs_notify_on_insert on public.moderation_logs;
create trigger moderation_logs_notify_on_insert
after insert on public.moderation_logs
for each row
execute function public.notify_moderation_log_inserted();

notify pgrst, 'reload schema';
