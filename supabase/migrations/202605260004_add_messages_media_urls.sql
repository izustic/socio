alter table public.messages
add column if not exists media_urls jsonb default '[]'::jsonb;

alter table public.messages
drop constraint if exists messages_media_urls_array_check;

alter table public.messages
add constraint messages_media_urls_array_check
check (jsonb_typeof(media_urls) = 'array');

notify pgrst, 'reload schema';
