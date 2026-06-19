-- Add a real Circle meetup deadline for countdown and post-deadline leave flow.

alter table public.circles
add column if not exists meetup_days integer not null default 3,
add column if not exists meetup_deadline timestamptz;

alter table public.circles
drop constraint if exists valid_meetup_days;

alter table public.circles
add constraint valid_meetup_days check (meetup_days between 3 and 10);

update public.circles
set meetup_deadline = created_at + (meetup_days || ' days')::interval
where meetup_deadline is null;

create or replace function public.close_circle(p_circle_id text)
returns void
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
    raise exception 'Circle not found';
  end if;

  if v_circle.creator_id::text <> auth.uid()::text then
    raise exception 'Only the host can close this Circle';
  end if;

  v_deadline := coalesce(
    v_circle.meetup_deadline,
    v_circle.created_at + (v_circle.meetup_days || ' days')::interval
  );

  if v_deadline > now() then
    raise exception 'Circle can only be closed after the meetup window ends';
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

grant execute on function public.close_circle(text) to authenticated;

notify pgrst, 'reload schema';
