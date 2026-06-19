-- Persistent profile settings for notifications, privacy, and safety surfaces.

alter table public.users
add column if not exists notification_settings jsonb not null default '{
  "circleActivity": true,
  "newMessages": true,
  "mutualMatches": true,
  "suggestions": false,
  "productUpdates": false,
  "quietHours": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}'::jsonb,
add column if not exists privacy_settings jsonb not null default '{
  "showInCircleSwipes": true,
  "shareApproximateDistance": true,
  "privateProfile": false
}'::jsonb,
add column if not exists verified_photo boolean not null default false;

create table if not exists public.blocked_users (
  blocker_id text not null references public.users(id) on delete cascade,
  blocked_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocked_users enable row level security;

drop policy if exists "Users read own blocked accounts" on public.blocked_users;
create policy "Users read own blocked accounts"
on public.blocked_users
for select
using (blocker_id = auth.uid()::text);

drop policy if exists "Users block accounts" on public.blocked_users;
create policy "Users block accounts"
on public.blocked_users
for insert
with check (blocker_id = auth.uid()::text and blocked_id <> auth.uid()::text);

drop policy if exists "Users unblock accounts" on public.blocked_users;
create policy "Users unblock accounts"
on public.blocked_users
for delete
using (blocker_id = auth.uid()::text);

alter table public.users replica identity full;
alter table public.blocked_users replica identity full;
alter table public.reports replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'users'
  ) then
    alter publication supabase_realtime add table public.users;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'blocked_users'
  ) then
    alter publication supabase_realtime add table public.blocked_users;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table public.reports;
  end if;
end $$;

notify pgrst, 'reload schema';
