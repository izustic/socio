alter table public.messages
add column if not exists media_type text;

alter table public.messages
drop constraint if exists messages_media_type_check;

alter table public.messages
add constraint messages_media_type_check
check (media_type in ('image', 'video') or media_type is null);

notify pgrst, 'reload schema';
