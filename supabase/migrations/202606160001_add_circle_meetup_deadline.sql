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
