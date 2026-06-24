-- Backfill moderation and chat access controls so the app does not rely on UI-only gates.

alter table public.reports enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.users enable row level security;
alter table public.messages enable row level security;
alter table public.circles enable row level security;

drop policy if exists "Users create own reports" on public.reports;
drop policy if exists "Users read own reports" on public.reports;
drop policy if exists "Moderators read reports" on public.reports;
drop policy if exists "Moderators manage reports" on public.reports;

create policy "Users create own reports"
on public.reports
for insert
to authenticated
with check (reporter_id = auth.uid()::text);

create policy "Users read own reports"
on public.reports
for select
to authenticated
using (reporter_id = auth.uid()::text);

create policy "Moderators read reports"
on public.reports
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role in ('moderator', 'admin')
  )
);

create policy "Moderators manage reports"
on public.reports
for update
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role in ('moderator', 'admin')
  )
);

drop policy if exists "Moderators and admins update users" on public.users;
create policy "Moderators and admins update users"
on public.users
for update
to authenticated
using (
  auth.uid()::text = id
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role in ('moderator', 'admin')
  )
)
with check (
  auth.uid()::text = id
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role in ('moderator', 'admin')
  )
);

drop policy if exists "Moderators read moderation logs" on public.moderation_logs;
drop policy if exists "Moderators write moderation logs" on public.moderation_logs;

create policy "Moderators read moderation logs"
on public.moderation_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role in ('moderator', 'admin')
  )
);

create policy "Moderators write moderation logs"
on public.moderation_logs
for insert
to authenticated
with check (
  moderator_id = auth.uid()::text
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role in ('moderator', 'admin')
  )
);

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
    where c.id::text = messages.circle_id::text
      and c.status = 'complete'
      and auth.uid()::text = any (c.members)
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
    where c.id::text = messages.circle_id::text
      and c.status = 'complete'
      and auth.uid()::text = any (c.members)
  )
);

create policy "Message senders delete own messages"
on public.messages
for delete
to authenticated
using (
  sender_id::text = auth.uid()::text
  and exists (
    select 1
    from public.circles c
    where c.id::text = messages.circle_id::text
      and c.status = 'complete'
      and auth.uid()::text = any (c.members)
  )
);

drop policy if exists "Circle members read chat media" on storage.objects;
drop policy if exists "Circle members upload chat media" on storage.objects;

create policy "Circle members read chat media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-media'
  and exists (
    select 1
    from public.circles c
    where c.id::text = (storage.foldername(name))[1]
      and c.status = 'complete'
      and auth.uid()::text = any (c.members)
  )
);

create policy "Circle members upload chat media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and exists (
    select 1
    from public.circles c
    where c.id::text = (storage.foldername(name))[1]
      and c.status = 'complete'
      and auth.uid()::text = any (c.members)
  )
);

notify pgrst, 'reload schema';
