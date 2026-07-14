-- User-created public events. Partner publishing can attach to the same model later.
do $$
begin
  create type public.community_event_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'removed');
exception
  when duplicate_object then null;
end $$;

create table public.community_events (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.users(id) on delete cascade,
  circle_id text null,
  title text not null check (char_length(title) between 2 and 120),
  category text not null,
  description text not null default '',
  location_name text not null,
  latitude double precision,
  longitude double precision,
  starts_at timestamptz not null,
  ends_at timestamptz,
  booking_url text,
  price_label text not null default 'Free',
  capacity integer check (capacity is null or capacity > 0),
  media jsonb not null default '[]'::jsonb,
  status public.community_event_status not null default 'pending',
  organizer_type text not null default 'user' check (organizer_type in ('user', 'organization')),
  organization_id uuid null,
  moderation_note text,
  reviewed_by text references public.users(id),
  reviewed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_event_dates_valid check (ends_at is null or ends_at >= starts_at)
);

create index community_events_discovery_idx on public.community_events(status, starts_at);
create index community_events_owner_month_idx on public.community_events(owner_id, created_at);

create table public.community_event_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  reporter_id text not null references public.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by text references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id, reporter_id)
);

alter table public.community_events enable row level security;
alter table public.community_event_reports enable row level security;

create policy "Anyone signed in can discover approved future community events"
on public.community_events for select to authenticated
using (
  (status = 'approved' and coalesce(ends_at, starts_at) >= now())
  or owner_id = auth.uid()::text
  or exists (select 1 from public.users u where u.id = auth.uid()::text and u.role in ('moderator', 'admin'))
);

create policy "Moderators can review community events"
on public.community_events for update to authenticated
using (exists (select 1 from public.users u where u.id = auth.uid()::text and u.role in ('moderator', 'admin')))
with check (exists (select 1 from public.users u where u.id = auth.uid()::text and u.role in ('moderator', 'admin')));

create policy "Users can report visible community events"
on public.community_event_reports for insert to authenticated
with check (reporter_id = auth.uid()::text);

create policy "Moderators can review community event reports"
on public.community_event_reports for select to authenticated
using (exists (select 1 from public.users u where u.id = auth.uid()::text and u.role in ('moderator', 'admin')));

-- Publishing is an RPC so the free allowance cannot be bypassed by a modified client.
create or replace function public.publish_community_event(
  p_circle_id text, p_title text, p_category text, p_description text,
  p_location_name text, p_latitude double precision, p_longitude double precision,
  p_starts_at timestamptz, p_booking_url text, p_price_label text,
  p_capacity integer, p_media jsonb
) returns public.community_events
language plpgsql security definer set search_path = public as $$
declare
  v_event public.community_events;
  v_plus boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_starts_at <= now() then raise exception 'Event time must be in the future'; end if;
  if p_starts_at > now() + interval '1 month' then raise exception 'Public events can be scheduled up to one month ahead'; end if;
  if not exists (select 1 from circles c where c.id::text = p_circle_id and auth.uid()::text = any(c.members)) then
    raise exception 'You are not a member of this Circle';
  end if;
  select coalesce(is_socio_plus, false) into v_plus from users where id = auth.uid()::text;
  if not v_plus and exists (
    select 1 from community_events
    where owner_id = auth.uid()::text
      and created_at >= date_trunc('month', now())
      and created_at < date_trunc('month', now()) + interval '1 month'
      and status not in ('rejected', 'cancelled', 'removed')
  ) then raise exception using errcode = 'P0001', message = 'FREE_PUBLIC_EVENT_LIMIT'; end if;

  insert into community_events(owner_id, circle_id, title, category, description,
    location_name, latitude, longitude, starts_at, booking_url, price_label, capacity, media)
  values(auth.uid()::text, p_circle_id, trim(p_title), p_category, coalesce(trim(p_description), ''),
    trim(p_location_name), p_latitude, p_longitude, p_starts_at, nullif(trim(p_booking_url), ''),
    coalesce(nullif(trim(p_price_label), ''), 'Free'), p_capacity, coalesce(p_media, '[]'::jsonb))
  returning * into v_event;
  return v_event;
end $$;

grant execute on function public.publish_community_event(text,text,text,text,text,double precision,double precision,timestamptz,text,text,integer,jsonb) to authenticated;

create or replace function public.cancel_community_event(p_event_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update community_events set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = p_event_id and owner_id = auth.uid()::text and status in ('pending', 'approved');
  if not found then raise exception 'Event not found or cannot be cancelled'; end if;
end $$;
grant execute on function public.cancel_community_event(uuid) to authenticated;

create policy "Authenticated users can read approved community event media"
on storage.objects for select to authenticated
using (
  bucket_id = 'chat-media' and exists (
    select 1 from public.community_events e
    where (e.status = 'approved' or e.owner_id = auth.uid()::text)
      and e.media @> jsonb_build_array(jsonb_build_object('path', storage.objects.name))
  )
);

grant select, update on public.community_events to authenticated;
grant insert on public.community_event_reports to authenticated;
notify pgrst, 'reload schema';
