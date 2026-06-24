create table if not exists public.circles (
  id text primary key,
  name text not null,
  creator_id text references public.users(id),
  size integer not null,
  members text[] default '{}',
  pending_swipes jsonb default '{}'::jsonb,
  skipped_swipes jsonb default '{}'::jsonb,
  filters jsonb,
  meetup_goal text,
  status text default 'forming',
  created_at timestamp default now()
);

alter table public.circles
add column if not exists name text,
add column if not exists creator_id text references public.users(id),
add column if not exists size integer,
add column if not exists members text[] default '{}',
add column if not exists pending_swipes jsonb default '{}'::jsonb,
add column if not exists skipped_swipes jsonb default '{}'::jsonb,
add column if not exists filters jsonb,
add column if not exists meetup_goal text,
add column if not exists status text default 'forming',
add column if not exists created_at timestamp default now();

notify pgrst, 'reload schema';
