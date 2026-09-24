# Database migrations

Every new `public` table used through `supabase-js` / the Data API must receive
explicit grants in its creation migration. Supabase no longer guarantees default
table grants. Pair grants with RLS and policies: grants permit an operation on a
table, while policies determine which rows the caller may access.

- Grant `authenticated` only the operations required by the app and its policies.
- Grant `service_role` the operations used by Edge Functions. Bypassing RLS does
  not bypass table privileges. Filtered writes and upserts can also need SELECT.
- Grant `anon` only when unauthenticated access is intentional.
- SECURITY DEFINER RPCs use their owner's table privileges; callers need EXECUTE
  on the function, not direct write grants on its underlying tables.
- If a new table uses a sequence-backed default, include the required sequence
  privileges for roles inserting rows. Current table-creation migrations use
  text/UUID IDs and do not create sequences.

`202609240001_explicit_data_api_grants.sql` applies the explicit grants to
existing databases without replaying historical migrations. It is additive: it
neither revokes existing privileges nor changes default privileges or RLS.
Deploy it through the project's normal migration process. Historical creation
migrations also contain the grants for environments applying them for the first
time.

Validate against a disposable database with automatic table grants disabled,
using authenticated sessions for app operations and a service-role client for
Edge Function operations. Check poll creation/voting, notification read/update/
delete, blocking/unblocking, circle creation/updates, subscription verification,
account deletion, meetup plans, and community event publishing/reporting/review.

The repository's migration history assumes an existing base schema (including
`users`, `messages`, `reports`, `moderation_logs`, and `circle_pending`); it is not
a complete empty-database bootstrap. Provision that baseline and its intended
grants before replaying migrations. The explicit grants change does not repair
those pre-existing bootstrap dependencies.
