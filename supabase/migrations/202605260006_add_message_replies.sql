alter table public.messages
add column if not exists reply_to_message_id text,
add column if not exists reply_to_sender_name text,
add column if not exists reply_to_text text,
add column if not exists reply_to_media_type text;

alter table public.messages
drop constraint if exists messages_reply_to_media_type_check;

alter table public.messages
add constraint messages_reply_to_media_type_check
check (reply_to_media_type in ('image', 'video') or reply_to_media_type is null);

notify pgrst, 'reload schema';
