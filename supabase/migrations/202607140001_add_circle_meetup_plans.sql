-- Shared meetup-planning state for every member of a Circle.

create table if not exists public.circle_meetup_plans (
  circle_id text primary key,
  plan jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.circle_meetup_plans enable row level security;

drop policy if exists "Circle members can read meetup plans"
on public.circle_meetup_plans;
create policy "Circle members can read meetup plans"
on public.circle_meetup_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.circles c
    where c.id::text = circle_meetup_plans.circle_id
      and auth.uid()::text = any (c.members)
  )
);

drop policy if exists "Circle members can create meetup plans"
on public.circle_meetup_plans;
create policy "Circle members can create meetup plans"
on public.circle_meetup_plans
for insert
to authenticated
with check (
  exists (
    select 1
    from public.circles c
    where c.id::text = circle_meetup_plans.circle_id
      and auth.uid()::text = any (c.members)
  )
);

drop policy if exists "Circle members can update meetup plans"
on public.circle_meetup_plans;
create policy "Circle members can update meetup plans"
on public.circle_meetup_plans
for update
to authenticated
using (
  exists (
    select 1
    from public.circles c
    where c.id::text = circle_meetup_plans.circle_id
      and auth.uid()::text = any (c.members)
  )
)
with check (
  exists (
    select 1
    from public.circles c
    where c.id::text = circle_meetup_plans.circle_id
      and auth.uid()::text = any (c.members)
  )
);

grant select, insert, update on public.circle_meetup_plans to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.circle_meetup_plans;
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
