do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'notification_type'
  ) then
    alter type public.notification_type add value if not exists 'circle_invite';
    alter type public.notification_type add value if not exists 'circle_accepted';
    alter type public.notification_type add value if not exists 'circle_almost_full';
    alter type public.notification_type add value if not exists 'circle_complete';
    alter type public.notification_type add value if not exists 'message';
    alter type public.notification_type add value if not exists 'system';
  end if;
end $$;

notify pgrst, 'reload schema';
