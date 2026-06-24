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
