-- Socio+ entitlement used to unlock the Likes tab.

alter table public.users
add column if not exists is_socio_plus boolean not null default false;

notify pgrst, 'reload schema';
