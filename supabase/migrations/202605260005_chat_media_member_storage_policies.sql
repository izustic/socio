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
    cross join lateral unnest(c.members) as member_id
    where c.id::text = (storage.foldername(name))[1]
      and member_id::text = auth.uid()::text
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
    cross join lateral unnest(c.members) as member_id
    where c.id::text = (storage.foldername(name))[1]
      and member_id::text = auth.uid()::text
  )
);
