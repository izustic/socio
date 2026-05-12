alter table public.users
add column if not exists display_name text,
add column if not exists age integer,
add column if not exists gender text,
add column if not exists interests text[] default '{}',
add column if not exists traits text[] default '{}',
add column if not exists media jsonb default '[]'::jsonb,
add column if not exists education text,
add column if not exists location jsonb,
add column if not exists photo_url text,
add column if not exists bio text,
add column if not exists notifications_enabled boolean default true,
add column if not exists location_enabled boolean default true,
add column if not exists profile_complete boolean default false;

notify pgrst, 'reload schema';
