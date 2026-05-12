alter table public.circles enable row level security;

drop policy if exists "Public read circles" on public.circles;
drop policy if exists "Users create own circles" on public.circles;
drop policy if exists "Circle creators update circles" on public.circles;

create policy "Public read circles"
on public.circles
for select
using (true);

create policy "Users create own circles"
on public.circles
for insert
with check (auth.uid()::text = creator_id);

create policy "Circle creators update circles"
on public.circles
for update
using (auth.uid()::text = creator_id)
with check (auth.uid()::text = creator_id);

notify pgrst, 'reload schema';
