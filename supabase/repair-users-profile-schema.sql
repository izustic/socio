alter table public.users
add column if not exists display_name text,
add column if not exists age integer,
add column if not exists gender text,
add column if not exists interests text[] default '{}',
add column if not exists traits text[] default '{}',
add column if not exists media jsonb default '[]'::jsonb,
add column if not exists education text,
add column if not exists location jsonb,
add column if not exists photo_url text,
add column if not exists bio text,
add column if not exists notifications_enabled boolean default false,
add column if not exists location_enabled boolean default false,
add column if not exists profile_complete boolean default false;

alter table public.users
alter column gender drop default;

alter table public.users
alter column gender type text
using gender::text;

alter table public.users enable row level security;

drop policy if exists "Public read users" on public.users;
drop policy if exists "Users insert own profile" on public.users;
drop policy if exists "Users update own profile" on public.users;

create policy "Public read users"
on public.users
for select
using (true);

create policy "Users insert own profile"
on public.users
for insert
with check (auth.uid()::text = id);

create policy "Users update own profile"
on public.users
for update
using (auth.uid()::text = id)
with check (auth.uid()::text = id);

notify pgrst, 'reload schema';
