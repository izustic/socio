-- Socio+ subscription entitlement records.

alter table public.users
add column if not exists subscription_status text not null default 'inactive',
add column if not exists subscription_platform text,
add column if not exists subscription_product_id text,
add column if not exists subscription_expires_at timestamptz;

create table if not exists public.socio_plus_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  product_id text not null,
  purchase_token text,
  transaction_id text,
  original_transaction_id text,
  status text not null default 'inactive',
  expires_at timestamptz,
  is_active boolean not null default false,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists socio_plus_subscriptions_user_idx
on public.socio_plus_subscriptions(user_id);

create unique index if not exists socio_plus_subscriptions_ios_tx_idx
on public.socio_plus_subscriptions(transaction_id)
where transaction_id is not null;

create unique index if not exists socio_plus_subscriptions_android_token_idx
on public.socio_plus_subscriptions(purchase_token)
where purchase_token is not null;

alter table public.socio_plus_subscriptions enable row level security;

drop policy if exists "Users read own Socio+ subscriptions" on public.socio_plus_subscriptions;
create policy "Users read own Socio+ subscriptions"
on public.socio_plus_subscriptions
for select
using (auth.uid()::text = user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists socio_plus_subscriptions_touch_updated_at
on public.socio_plus_subscriptions;
create trigger socio_plus_subscriptions_touch_updated_at
before update on public.socio_plus_subscriptions
for each row
execute function public.touch_updated_at();

notify pgrst, 'reload schema';
