alter table public.users
add column if not exists education text;

notify pgrst, 'reload schema';
