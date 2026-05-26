alter table public.messages
drop constraint if exists messages_media_type_check;

alter table public.messages
add constraint messages_media_type_check
check (media_type in ('image', 'video', 'audio') or media_type is null);

alter table public.messages
drop constraint if exists messages_reply_to_media_type_check;

alter table public.messages
add constraint messages_reply_to_media_type_check
check (reply_to_media_type in ('image', 'video', 'audio') or reply_to_media_type is null);

notify pgrst, 'reload schema';
