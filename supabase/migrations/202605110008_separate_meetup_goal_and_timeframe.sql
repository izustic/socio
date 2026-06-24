-- Separate meetup_goal into goal and timeframe
-- This fixes the enum error by converting meetup_goal from enum to text
-- and adding a separate meetup_timeframe column

-- Drop the existing constraint/check if it exists
alter table public.circles
drop constraint if exists valid_meetup_goal;

-- Convert meetup_goal column from enum to text if it is currently an enum
alter table public.circles
alter column meetup_goal type text using meetup_goal::text;

-- Add meetup_timeframe column for storing the timeframe separately
alter table public.circles
add column if not exists meetup_timeframe text default 'Within 3 days';

-- Extract timeframe from any combined values before normalizing meetup_goal
update public.circles
set meetup_timeframe = split_part(meetup_goal::text, ' · ', 2)
where meetup_goal::text like '% · %';

-- Normalize meetup_goal to only the base goal text
update public.circles
set meetup_goal = split_part(meetup_goal::text, ' · ', 1)
where meetup_goal::text like '% · %';

-- Add a check constraint to ensure meetup_goal has valid base values only
alter table public.circles
add constraint valid_meetup_goal check (
  meetup_goal in ('Coffee', 'Study', 'Gym', 'Walk', 'Dinner', '')
);

notify pgrst, 'reload schema';
