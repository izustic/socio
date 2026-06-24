alter table public.users
add column if not exists location_enabled boolean default false,
add column if not exists notifications_enabled boolean default false;

notify pgrst, 'reload schema';
