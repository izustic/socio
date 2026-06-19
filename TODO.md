# Socio TODO

Updated: June 2026 — rewritten as a prioritized, ordered backlog.

Legend:

- `[x]` done in the current codebase
- `[~]` partially implemented or needs verification
- `[ ]` still to do
- `[P0]` / `[P1]` / `[P2]` = priority for a production-ready v1
  - `P0` — must be fixed before any real users touch the app (security, data loss, broken core loop)
  - `P1` — required for a credible v1 launch (Circle creation/matching, chat, notifications)
  - `P2` — polish, moderation tooling, release readiness

> Source of truth: `ARCHITECTURE.md` (v2.1) plus the current codebase.
> See `PLAN.md` for the higher-level phase plan and `README.md` for the public
> project description.

---

## 0. Next 10 actions (start here)

These are the highest-leverage items to pick up in order. Doing only these
unblocks the rest of the backlog.

1. **[P0] Stop tracking `.env`, add it to `.gitignore`, add `.env.example`**, then rotate any keys already committed.
2. **[P0] Reconcile `ARCHITECTURE.md` with reality** (done in v2.1 — keep it honest going forward).
3. **[P0] Verify deployed Supabase schema, RLS, and storage buckets** (`users`, `circles`, `circle_pending`, `messages`, `notifications`, `reports`, `moderation_logs`, `polls`, `poll_options`, `poll_votes`; `avatars` and `chat-media` buckets) match `ARCHITECTURE.md`.
4. **[P0] Consolidate auth/role redirect logic** into one route guard so banned/suspended/incomplete-profile paths are enforced consistently across `app/index.tsx`, `app/_layout.tsx`, and tab screens.
5. **[P0] Consolidate Circle creation routes** (`create.tsx` vs `create-circle.tsx`) and finish stage-1 fields (name, vibe, size, radius, meetup goal, meetup timeframe).
6. **[P1] Wire `ChatInput` / `MessageBubble` / `MediaMessage` into `app/circle/chat.tsx`** with realtime messages, reply UI, and polls.
7. **[P1] Enforce chat access only for complete Circles and members** (UI + RLS).
8. **[P1] Verify host deck prioritizes joiners who liked the Circle** and verify full Circle completion end-to-end.
9. **[P1] Verify joiner "like Circle" → host "like back" → joiner added → routed to chat** end-to-end against real Supabase data.
10. **[P1] Replace placeholder admin/moderator screens** with real data-backed reports queue, report detail, and user management; write to `moderation_logs` on every action.

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
- [~] Legacy Expo starter components still exist under top-level `components/`
- [ ] **P2** Remove duplicate starter-era components if no longer used
- [ ] **P2** Reduce lint warnings from unused imports, hook dependencies, and style cleanup (24 warnings remain)

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
- [~] `.env` exists and is currently tracked by git
- [~] `.gitignore` ignores `.env*.local`, but not plain `.env`
- [~] LiveKit secrets are documented as backend-only
- [ ] **P0** Stop tracking `.env`
- [ ] **P0** Add `.env` to `.gitignore`
- [ ] **P0** Add `.env.example`
- [ ] **P0** Rotate any credentials that were committed or shared
- [ ] **P0** Remove or rotate any sensitive Firebase/Google config if `google-services.json` is not required
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
- [ ] **P1** Verify Google OAuth behavior
- [ ] **P1** Verify Facebook OAuth behavior
- [ ] **P1** Request and store Expo notification token
- [ ] **P1** Add media reordering and main-photo selection
- [ ] **P1** Add stronger validation, loading states, and user-facing errors

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
- [~] Profile tab exists
- [ ] **P0** Consolidate auth/role redirect logic between `app/index.tsx`, layouts, and tab screens
- [ ] **P1** Add polished loading, empty, and error states across tabs

## 6. Profile

- [x] Profile screen reads current auth/profile data
- [x] Edit profile route exists
- [~] Edit profile screen is currently a placeholder
- [ ] **P1** Build full edit profile form
- [ ] **P1** Add save actions and validation
- [ ] **P1** Support profile media updates, reordering, and main-photo selection
- [ ] **P1** Support notification/location preference updates

## 7. Circle Creation

- [x] Circle create service function
- [x] Circle creation routes exist
- [x] Create preferences route exists
- [x] Circle creation persists core fields to Supabase
- [x] Route users after Circle creation
- [~] Create Circle UI exists but overlaps across `create.tsx` and `create-circle.tsx`
- [~] Some Circle fields and schema expectations still need verification
- [ ] **P0** Consolidate duplicate Circle creation routes
- [ ] **P0** Finish and verify name, vibe, size, radius, meetup goal, and meetup timeframe fields
- [ ] **P0** Finish host preference setup for age, gender mix, education, interests, traits, and distance
- [ ] **P0** Add validation and user-facing create errors

## 8. Host Swipe Flow

- [x] Host swipe route exists
- [x] Candidate loading from Supabase
- [x] Like/pass submission service
- [x] Circle progress route exists
- [x] Circle complete route exists
- [x] Swipe tab hides when hosted Circle is full
- [~] Match feedback exists in parts but needs polish
- [~] Membership updates are implemented through services/RPCs but need integration verification
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
- [~] Notification creation is client-triggered and should move server-side for stronger production security
- [~] Supabase notification migration exists but needs deployment verification
- [ ] **P1** Create notifications for moderation events
- [ ] **P1** Verify notification routing against real matched/Circle/message data
- [ ] **P2** Store Expo push tokens and add push delivery strategy

## 13. Moderation and Admin

- [x] Moderator routes exist
- [x] Admin routes exist
- [x] Report service function exists
- [x] Ban/suspend service functions exist
- [~] Moderator dashboard exists but needs production functionality verification
- [~] Report detail route exists but needs production functionality verification
- [~] Admin dashboard and user management routes exist but need production functionality verification
- [ ] **P1** Build or verify reports list against real data
- [ ] **P1** Build or verify report resolution flow
- [ ] **P1** Build or verify admin user management actions
- [ ] **P1** Add unban/promote/demote actions if missing
- [ ] **P1** Add moderation audit log writes for every action

## 14. Tooling, Release, and Docs

- [x] `ARCHITECTURE.md` documents target architecture (v2.1 now reconciled with reality)
- [x] `PLAN.md` documents phased implementation plan
- [x] `README.md` describes current project status
- [x] `TODO.md` updated with current done/remaining work (this file)
- [x] `npm run lint` passes with zero errors
- [~] 24 lint warnings remain for unrelated unused imports and hook dependencies
- [ ] **P2** Add automated tests for services and critical flows
- [ ] **P2** Add CI checks
- [ ] **P2** Add release/build instructions for EAS or native builds
- [ ] **P2** Update app identifiers from `com.anonymous.demoapp` / `demoapp` before production

---

## Priority summary

- **P0 (security + core loop integrity):** env hygiene, credential rotation,
  Supabase schema/RLS/storage verification, route-guard consolidation,
  Circle creation consolidation + completion, chat access enforcement.
- **P1 (credible v1 launch):** onboarding polish (real OAuth/OTP, push
  tokens, media reorder), edit profile form, full host/joiner swipe loop
  verified end-to-end, chat media end-to-end, LiveKit Edge Function deployed
  and member-restricted, real admin/moderator screens, moderation audit
  log writes, server-side notifications.
- **P2 (polish + release):** E2EE keys, push delivery, message deletion,
  automated tests, CI, EAS release process, app identifier rename,
  starter-component cleanup, lint warning cleanup.
