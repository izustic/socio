# Socio TODO

Updated: June 24, 2026 — rewritten after a full pass over the codebase and
`ARCHITECTURE.md`. Reflects what's actually in the repo right now (not what's
in old sections of the plan).

Legend:

- `[x]` done in the current codebase
- `[~]` partially implemented or needs verification
- `[ ]` still to do
- `[P0]` / `[P1]` / `[P2]` = priority for a production-ready v1
  - `P0` — must be fixed before any real users touch the app (security, data loss, broken core loop)
  - `P1` — required for a credible v1 launch (Circle creation/matching, chat, notifications, moderation)
  - `P2` — polish, release readiness

> Source of truth: `ARCHITECTURE.md` (v2.1) plus the current codebase.
> See `PLAN.md` for the higher-level phase plan and `README.md` for the public
> project description.

---

## Current state (verified June 24, 2026)

**Working end to end in code (pending device verification):**

- Auth + onboarding flow (welcome → email/OTP → permissions → 4-step profile)
- Google OAuth sign-in is wired through the native Google Sign-In SDK and Supabase ID-token exchange; Facebook is hidden from the auth surface for now
- Auth/role redirect: `app/index.tsx` correctly routes banned / suspended /
  moderator / admin / incomplete-profile users
- Bottom tab shell with circle / swipe / alerts / profile
- Host and joiner swipe flows, with `SwipeUsersScreen` and
  `SwipeCirclesScreen` under `src/screens/circle/`
- Chat screen (`CircleChatScreen`) — wired to realtime messages, polls,
  replies, media, and a call-entry button in the header
- Call screen (`app/circle/call.tsx`) — real `VideoView`, mic/camera
  toggles, error and connection states
- `useCircleCall` hook and `src/services/livekit.ts` token service
- `get-livekit-token` Edge Function — authenticates the caller, verifies
  circle membership, requires `circle.status = 'complete'`
- Swipe Circles refreshes on focus and `circles` table changes so completed
  Circles fall out of the deck without a manual reload.
- `delete-account` Edge Function source exists
- Notifications tab with realtime list, mark-one / mark-all read
- Moderation-event notifications now originate from database triggers
  instead of the client, so report and moderation actions fan out server-side.
- Profile screen with edit form (5 media slots, age, gender, interests,
  traits, bio, location)
- Settings routes: notifications, privacy-safety, delete-account
- Moderator and admin routes now render data-backed reports, report detail,
  and user management screens, with moderation actions written to
  `moderation_logs`
- Circle creation now uses `app/circle/create.tsx` as the single entry
  point, with `vibe` carried through to preferences and the duplicate route
  removed.
- Host swipe RPC text/UUID mismatch has a local migration fix queued so the
  deployed database can accept host swipes again.
- Starter-era root `components/` and `hooks/` scaffolding has been removed,
  and helper tests now cover auth, Circle creation, chat message helpers, and
  moderation helpers.

**Verified gaps:**

- ~~`.env` is currently tracked by git AND is not in `.gitignore` (only
  `.env*.local` is). This is the #1 P0.~~ **Fixed:** `.env` is untracked
  and `.gitignore` now ignores it. `.env.example` is in the repo.
  **Still need to rotate the leaked keys** (see Section 3) before any
  real-user launch.
- Moderator/admin screens are now implemented, but still need real Supabase
  deployment verification for the backing schema, policies, and bucket access.
- Chat RLS now has a local follow-up migration that requires
  `circle.status = 'complete'` and user membership, but the deployed
  Supabase project still needs verification.
- Lint is clean locally (`npm run lint` passes with 0 errors and 0 warnings).
- ~~App identifier is still `com.anonymous.demoapp` / `demoapp`.~~ **Fixed:** renamed to `com.izustic.socio` / `socio` scheme.

---

## 0. Next 10 actions (start here)

These are the highest-leverage items to pick up in order. Doing only these
unblocks the rest of the backlog.

1. **[P0] ~~Stop tracking `.env`, add it to `.gitignore`, add `.env.example`~~ DONE.** Run `git rm --cached .env` (done), confirm `.env` is in `.gitignore` (done), commit `.env.example` (TODO). **Still required: rotate any keys that were committed** — see Section 3.
2. **[P0] ~~Replace the four admin/moderator placeholder screens~~ DONE.**
   Data-backed moderator dashboard, report detail, admin dashboard, and user
   management screens now exist, with ban / suspend / dismiss / role actions
   writing to `moderation_logs` via `src/services/moderation.ts`. Still
   verify the deployed schema and policies.
3. **[P0] Verify deployed Supabase schema, RLS, and storage buckets**
   (`users`, `circles`, `circle_pending`, `messages`, `notifications`,
   `reports`, `moderation_logs`, `polls`, `poll_options`, `poll_votes`;
   `avatars` and `chat-media` buckets) match `ARCHITECTURE.md` and the
   25 migrations under `supabase/migrations/`.
4. **[P0] ~~Enforce chat access in RLS~~ DONE locally.** Added
   `202606240001_moderation_and_chat_rls.sql` so chat reads/writes and chat
   media access now require membership in a `complete` Circle. Deployed
   project verification is still pending.
5. **[P0] ~~Consolidate Circle creation routes~~ DONE.** `app/circle/create.tsx`
   is now the canonical entry point, `app/circle/create-circle.tsx` has been
   removed, and the stage-1 vibe field now flows through to preferences.
6. **[P1] Verify host deck prioritizes joiners who liked the Circle** and
   verify full Circle completion end-to-end against a real Supabase
   project.
7. **[P1] Verify joiner "like Circle" → host "like back" → joiner added →
   routed to chat** end-to-end against real Supabase data.
8. **[P1] Deploy `get-livekit-token` and run a real device call** between
   two Circle members to validate token issuance, room join, and media.
9. **[P1] Verify real-device auth flows** — phone OTP and native Google OAuth.
   `src/services/auth.ts` is implemented; the gap is device-only.
10. **[P1] Move notification creation server-side.** Currently
    `src/services/notifications.ts` creates notifications from the
    client. Move to Postgres triggers or a server-side function so a
    malicious client cannot fabricate notifications.

---

## 1. Foundation

- [x] Expo Router app scaffold
- [x] Native iOS and Android folders generated
- [x] Shared theme constants
- [x] Core UI components: Button, Input, Chip, Avatar, StepIndicator, DualSlider, MediaGrid
- [x] Circle UI components: ProfileCard, CircleCard, CircleProgress, MemberRow, CapacityBadge
- [x] Chat UI components: ChatInput, MessageBubble, MediaMessage, PollComponents
- [x] Onboarding UI components and layout
- [x] Lottie splash screen
- [x] Legacy Expo starter components and hooks removed from the top-level scaffold
- [x] Remove duplicate starter-era components if no longer used
- [x] Reduce lint warnings from unused imports, hook dependencies, and style cleanup (now clean)

## 2. Supabase Backend

- [x] Supabase client configured in `src/services/supabase.ts`
- [x] SecureStore auth persistence
- [x] Supabase Auth service
- [x] User profile service
- [x] Circle service
- [x] Swipe/matching service
- [x] Message service with realtime subscription
- [x] Notification service with realtime subscription
- [x] Poll service for chat polls
- [x] Moderation service functions
- [x] Storage upload helpers for avatars and chat media
- [x] Supabase SQL migrations committed under `supabase/migrations`
- [x] LiveKit token Edge Function source exists
- [~] RLS/storage policies are represented in migrations, but still need project-level verification
- [ ] **P0** Verify deployed tables match the current app code and `ARCHITECTURE.md`
- [ ] **P0** Verify `avatars` and `chat-media` buckets and policies in Supabase
- [ ] **P1** Deploy and verify `get-livekit-token`
- [ ] **P2** Remove or ignore Supabase local temp files if they should not be tracked

## 3. Security

- [x] Banned and suspended screens exist
- [x] Role/status fields are loaded through auth context
- [x] `.env` is no longer tracked by git (untracked with `git rm --cached`)
- [x] `.gitignore` now ignores `.env` (in addition to `.env*.local`)
- [x] `.env.example` committed with empty values for all required keys
- [x] LiveKit secrets are documented as backend-only
- [ ] **P0** **Rotate** the keys that were already committed to git history:
  - Supabase anon key (regenerate in Supabase Dashboard → Settings → API)
  - Google OAuth client ID (rotate in Google Cloud Console, or create a new
    OAuth client for the deployed app and keep the old one revoked)
  - **CRITICAL: the LiveKit API key/secret** (`LIVEKIT_API_KEY`,
    `LIVEKIT_API_SECRET`) were committed in plaintext. These are server-side
    secrets and must be rotated immediately in the LiveKit Cloud dashboard.
    Treat them as fully compromised and audit recent token issuance if the
    project was ever deployed.
- [x] ~~If `google-services.json` is not actually used, remove it from
      the repo~~ **DONE:** removed (project uses Supabase Auth, not Firebase).
- [ ] **P0** Enforce admin/moderator/member checks in Supabase policies, not just UI
- [ ] **P0** Confirm banned/suspended users are blocked consistently across routes and data access

## 4. Auth and Onboarding

- [x] Welcome screen
- [x] Email signup screen
- [x] Login screen
- [x] OTP screen
- [x] Location permission screen
- [x] Notifications permission screen
- [x] Onboarding intro screen
- [x] Profile photo/name screen
- [x] Profile age/gender screen
- [x] Profile interests screen
- [x] Profile traits screen
- [x] Profile complete screen
- [x] Onboarding context
- [x] Redirect incomplete users through onboarding
- [~] Media picking/upload during onboarding
- [~] Location permission and profile location flow exist, but need device verification
- [~] Notification permission flow exists, but push token storage is incomplete
- [ ] **P1** Verify real Supabase OTP behavior
- [~] **P1** Verify Google OAuth behavior — native Google Sign-In is wired in code; device verification still pending
- [x] Facebook OAuth is intentionally deferred for now and hidden from the auth surface
- [ ] **P1** Request and store Expo notification token
- [ ] **P1** Add media reordering and main-photo selection
- [x] **P1** Add stronger validation, loading states, and user-facing errors

## 5. Main App Shell

- [x] Root stack layout
- [x] Auth provider and onboarding provider wrap the app
- [x] Bottom tabs: Circle, Swipe, Alerts, Profile
- [x] App entry redirect based on auth/profile/role status
- [x] Banned screen
- [x] Suspended screen
- [x] Circle home tab chooses no-circle, progress, complete, or chat views
- [x] Swipe tab chooses host user-swipe or joiner Circle-swipe views
- [x] Notifications tab with realtime Supabase-backed list UI
- [x] Auth/role redirect consolidated in `app/index.tsx` (banned / suspended / moderator / admin / incomplete-profile all routed)
- [x] Auth layout redirect for incomplete profiles in `app/(auth)/_layout.tsx`
- [~] Profile tab exists
- [ ] **P1** Add polished loading, empty, and error states across tabs

## 6. Profile

- [x] Profile screen reads current auth/profile data
- [x] Edit profile route exists
- [x] Edit profile form is fully built (5 media slots, age, gender, interests, traits, bio, location, upload progress)
- [~] Edit profile media reordering and main-photo selection need device verification
- [~] Edit profile save flow + notification/location preference updates need device verification
- [x] **P1** Add validation, loading states, and user-facing error states to edit profile

## 7. Circle Creation

- [x] Circle create service function
- [x] Circle creation routes exist
- [x] Create preferences route exists
- [x] Circle creation persists core fields to Supabase
- [x] Route users after Circle creation
- [x] Create Circle UI now uses `create.tsx` as the canonical route
- [~] Some Circle fields and schema expectations still need verification
- [ ] **P0** Consolidate duplicate Circle creation routes
- [x] **P0** Finish and verify name, vibe, size, radius, meetup goal, and meetup timeframe fields
- [x] **P0** Finish host preference setup for age, gender mix, education, interests, traits, and distance
- [x] **P0** Add validation and user-facing create errors

## 8. Host Swipe Flow

- [x] Host swipe route exists
- [x] Candidate loading from Supabase
- [x] Like/pass submission service
- [x] Circle progress route exists
- [x] Circle complete route exists
- [x] Swipe tab hides when hosted Circle is full
- [~] Match feedback exists in parts but needs polish
- [~] Membership updates are implemented through services/RPCs but need integration verification
- [x] Host swipe RPC text/UUID mismatch fixed in a local migration
- [ ] **P1** Verify joiners who liked the Circle are prioritized in the host deck
- [ ] **P1** Verify full Circle completion behavior end to end
- [ ] **P1** Add empty deck screen behavior
- [ ] **P1** Add integration checks for matching and membership updates

## 9. Joiner Flow

- [x] Join preferences route exists
- [x] Swipe Circles route exists
- [x] Joiner filters are passed into the Swipe tab
- [x] Service support exists for Circle swipes and pending joiners
- [~] Join Preferences UI exists but needs full verification
- [~] Swipe Circles UI exists but needs full verification
- [x] Swipe Circles refreshes on focus and realtime Circle updates
- [~] Mutual-like flow is represented in service/RPC logic, but needs end-to-end verification
- [ ] **P1** Verify joiner-like-Circle flow against real Supabase data
- [ ] **P1** Verify matched joiner is added to the Circle and routed correctly
- [ ] **P1** Add joiner notifications
- [ ] **P1** Add empty/error states for no matching Circles

## 10. Chat, Media, and Polls

- [x] Message service supports send, fetch, delete, and realtime subscribe
- [x] Chat route exists
- [x] Chat screen is wired to live Circle/message loading
- [x] Chat components are used in the chat screen
- [x] Image/video/audio media paths are represented in chat UI and services
- [x] Reply UI and message reply fields exist
- [x] Poll creation, rendering, and voting services/components exist
- [x] Chat header includes call entry point
- [x] Chat messages create realtime notifications for other Circle members
- [~] Media upload and rendering need device/storage verification
- [~] Chat access control exists mainly through app flow and policies, but needs explicit verification
- [ ] **P0** Enforce chat access only for complete Circles and members (UI + RLS)
- [ ] **P1** Verify image upload messages end to end
- [ ] **P1** Verify video upload messages end to end
- [ ] **P1** Verify audio recording/upload messages end to end
- [ ] **P2** Add message deletion UI and permissions

## 11. LiveKit Calls

- [x] `@livekit/react-native`, LiveKit client, and WebRTC packages are installed
- [x] LiveKit Expo/plugin configuration exists in `app.json`
- [x] Edge Function source exists
- [x] LiveKit service invokes the Supabase Edge Function
- [x] `useCircleCall` hook manages room connection, participants, mic, and camera
- [x] Call screen renders participant grid and controls
- [~] Token request currently sends `circleId` and `userName`; verify Edge Function derives/authenticates user securely
- [~] Room join/leave and media controls are implemented but need device verification
- [ ] **P1** Deploy and verify the Edge Function with real LiveKit credentials
- [ ] **P1** Restrict token generation to valid Circle members
- [ ] **P2** Add E2EE key management
- [ ] **P2** Add call permission/error states for camera and microphone denial
- [ ] **P2** Remove debug logging from LiveKit token service

## 12. Notifications

- [x] Notification service with fetch, mark-read, and realtime subscribe helpers
- [x] Notifications table migration with indexes, RLS, and Realtime publication
- [x] Notification permission screen exists
- [x] Real notifications list UI matching the provided design
- [x] Subscribe to notification inserts, updates, and deletes in the tab
- [x] Mark-one-read and mark-all-read flows
- [x] Create notifications for joiner interest, accepted members, almost-full Circles, Circle completion, and chat activity
- [~] Notification creation is still client-triggered for most app flows and should move server-side for stronger production security
- [~] Supabase notification migration exists but needs deployment verification
- [x] **P1** Create notifications for moderation events
- [ ] **P1** Verify notification routing against real matched/Circle/message data
- [ ] **P2** Store Expo push tokens and add push delivery strategy

## 13. Moderation and Admin

- [x] Moderator routes exist
- [x] Admin routes exist
- [x] Report service function exists
- [x] Ban/suspend service functions exist
- [x] Moderator dashboard, report detail, admin dashboard, and user
  management routes now render real data-backed UIs
- [x] Build reports list against real `reports` data
- [x] Build report resolution flow (ban / suspend / dismiss actions)
- [x] Build admin user management actions
- [x] Add unban / promote / demote actions
- [x] Write `moderation_logs` audit entry on every moderation action
- [~] **P1** Enforce role checks in Supabase RLS, not just in UI
  (`users`, `reports`, and `moderation_logs` now have local policy coverage;
  deployed verification still pending)

## 14. Tooling, Release, and Docs

- [x] `ARCHITECTURE.md` documents target architecture (v2.1 now reconciled with reality)
- [x] `PLAN.md` documents phased implementation plan
- [x] `README.md` describes current project status
- [x] `TODO.md` updated with current done/remaining work (this file)
- [x] `npm run lint` passes with zero errors
- [x] Lint warnings are cleared
- [x] **P2** Add automated tests for services and critical flows
- [ ] **P2** Add CI checks
- [ ] **P2** Add release/build instructions for EAS or native builds
- [x] ~~Update app identifiers from `com.anonymous.demoapp` / `demoapp`~~ **DONE:** renamed to `com.izustic.socio` / `socio` (app.json, iOS Info.plist + pbxproj, Android build.gradle + AndroidManifest + Java sources, TS deeplink scheme).

---

## Priority summary

- **P0 (security + core loop integrity):** env hygiene + credential
  rotation; verifying deployed
  Supabase schema, RLS, and storage buckets; consolidating the two Circle
  creation routes.
- **P1 (credible v1 launch):** host/joiner swipe loop verified
  end-to-end against real Supabase data; deploying `get-livekit-token`
  and running a real device call; real-device auth (OTP, Google);
  server-side notification creation; Expo push token
  storage; media upload end-to-end (image / video / audio); edit
  profile media reordering + main-photo.
- **P2 (polish + release):** E2EE keys, message deletion UI, automated
  tests, CI, EAS release process, app identifier rename
  (`com.izustic.socio` → real bundle id for Play Store / App Store), starter-component
  cleanup, lint warning cleanup, crash reporting.
