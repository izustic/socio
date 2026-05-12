alter table public.users
alter column gender drop default;

alter table public.users
alter column gender type text
using gender::text;

notify pgrst, 'reload schema';
