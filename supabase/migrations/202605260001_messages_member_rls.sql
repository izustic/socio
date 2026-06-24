alter table public.messages enable row level security;

drop policy if exists "Circle members read messages" on public.messages;
drop policy if exists "Circle members insert own messages" on public.messages;
drop policy if exists "Message senders delete own messages" on public.messages;

create policy "Circle members read messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.circles c
    cross join lateral unnest(c.members) as member_id
    where c.id::text = messages.circle_id::text
      and member_id::text = auth.uid()::text
  )
);

create policy "Circle members insert own messages"
on public.messages
for insert
to authenticated
with check (
  sender_id::text = auth.uid()::text
  and exists (
    select 1
    from public.circles c
    cross join lateral unnest(c.members) as member_id
    where c.id::text = messages.circle_id::text
      and member_id::text = auth.uid()::text
  )
);

create policy "Message senders delete own messages"
on public.messages
for delete
to authenticated
using (sender_id::text = auth.uid()::text);

notify pgrst, 'reload schema';
