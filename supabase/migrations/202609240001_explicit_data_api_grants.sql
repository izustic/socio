-- Explicit Data API grants for databases where earlier migrations already ran.
-- Additive only: retain existing grants and RLS policies; do not change defaults.
-- Keep these in sync with grants in the corresponding table-creation migrations.

grant select, insert, update on public.circles to authenticated;
grant select, update, delete on public.circles to service_role;

grant select, insert, update on public.polls to authenticated;
grant select, insert on public.poll_options to authenticated;
grant select, insert, delete on public.poll_votes to authenticated;
-- Account deletion removes polls (cascading to options/votes) and a user's votes.
grant select, delete on public.polls, public.poll_votes to service_role;

-- Client inserts go through create_app_notification; Edge Functions insert directly.
grant select, update, delete on public.notifications to authenticated;
grant select, insert, delete on public.notifications to service_role;

grant select, insert, delete on public.blocked_users to authenticated;
grant select, delete on public.blocked_users to service_role;

grant select on public.socio_plus_subscriptions to authenticated;
-- Only the subscription verification Edge Function writes entitlement records.
grant select, insert, update on public.socio_plus_subscriptions to service_role;

-- Reassert the scoped grants from the newer feature migrations.
grant select, insert, update on public.circle_meetup_plans to authenticated;
grant select, update on public.community_events to authenticated;
grant select, insert on public.community_event_reports to authenticated;

notify pgrst, 'reload schema';
