# Socio TODO

Updated: June 2026

Legend:

- `[x]` done in the current codebase
- `[~]` partially implemented or needs verification
- `[ ]` still to do

## Foundation

- [x] Expo Router app scaffold
- [x] Native iOS and Android folders generated
- [x] Shared theme constants
- [x] Core UI components: Button, Input, Chip, Avatar, StepIndicator, DualSlider, MediaGrid
- [x] Circle UI components: ProfileCard, CircleCard, CircleProgress, MemberRow, CapacityBadge
- [x] Chat UI components: ChatInput, MessageBubble, MediaMessage, PollComponents
- [x] Onboarding UI components and layout
- [x] Lottie splash screen
- [~] Legacy Expo starter components still exist under top-level `components/`
- [ ] Remove duplicate starter-era components if no longer used
- [ ] Reduce lint warnings from unused imports, hook dependencies, and style cleanup

## Supabase Backend

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
- [ ] Verify deployed tables match the current app code and `ARCHITECTURE.md`
- [ ] Verify `avatars` and `chat-media` buckets and policies in Supabase
- [ ] Deploy and verify `get-livekit-token`
- [ ] Remove or ignore Supabase local temp files if they should not be tracked

## Security

- [x] Banned and suspended screens exist
- [x] Role/status fields are loaded through auth context
- [~] `.env` exists and is currently tracked by git
- [~] `.gitignore` ignores `.env*.local`, but not plain `.env`
- [~] LiveKit secrets are documented as backend-only
- [ ] Stop tracking `.env`
- [ ] Add `.env` to `.gitignore`
- [ ] Add `.env.example`
- [ ] Rotate any credentials that were committed or shared
- [ ] Remove or rotate any sensitive Firebase/Google config if `google-services.json` is not required
- [ ] Enforce admin/moderator/member checks in Supabase policies, not just UI
- [ ] Confirm banned/suspended users are blocked consistently across routes and data access

## Auth and Onboarding

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
- [ ] Verify real Supabase OTP behavior
- [ ] Verify Google OAuth behavior
- [ ] Verify Facebook OAuth behavior
- [ ] Request and store Expo notification token
- [ ] Add media reordering and main-photo selection
- [ ] Add stronger validation, loading states, and user-facing errors

## Main App Shell

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
- [ ] Consolidate auth/role redirect logic between `app/index.tsx`, layouts, and tab screens
- [ ] Add polished loading, empty, and error states across tabs

## Profile

- [x] Profile screen reads current auth/profile data
- [x] Edit profile route exists
- [~] Edit profile screen is currently a placeholder
- [ ] Build full edit profile form
- [ ] Add save actions and validation
- [ ] Support profile media updates, reordering, and main-photo selection
- [ ] Support notification/location preference updates

## Circle Creation

- [x] Circle create service function
- [x] Circle creation routes exist
- [x] Create preferences route exists
- [x] Circle creation persists core fields to Supabase
- [x] Route users after Circle creation
- [~] Create Circle UI exists but overlaps across `create.tsx` and `create-circle.tsx`
- [~] Some Circle fields and schema expectations still need verification
- [ ] Consolidate duplicate Circle creation routes
- [ ] Finish and verify name, vibe, size, radius, meetup goal, and meetup timeframe fields
- [ ] Finish host preference setup for age, gender mix, education, interests, traits, and distance
- [ ] Add validation and user-facing create errors

## Host Swipe Flow

- [x] Host swipe route exists
- [x] Candidate loading from Supabase
- [x] Like/pass submission service
- [x] Circle progress route exists
- [x] Circle complete route exists
- [x] Swipe tab hides when hosted Circle is full
- [~] Match feedback exists in parts but needs polish
- [~] Membership updates are implemented through services/RPCs but need integration verification
- [ ] Verify joiners who liked the Circle are prioritized in the host deck
- [ ] Verify full Circle completion behavior end to end
- [ ] Add empty deck screen behavior
- [ ] Add integration checks for matching and membership updates

## Joiner Flow

- [x] Join preferences route exists
- [x] Swipe Circles route exists
- [x] Joiner filters are passed into the Swipe tab
- [x] Service support exists for Circle swipes and pending joiners
- [~] Join Preferences UI exists but needs full verification
- [~] Swipe Circles UI exists but needs full verification
- [~] Mutual-like flow is represented in service/RPC logic, but needs end-to-end verification
- [ ] Verify joiner-like-Circle flow against real Supabase data
- [ ] Verify matched joiner is added to the Circle and routed correctly
- [ ] Add joiner notifications
- [ ] Add empty/error states for no matching Circles

## Chat, Media, and Polls

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
- [ ] Enforce chat access only for complete Circles and members
- [ ] Verify image upload messages end to end
- [ ] Verify video upload messages end to end
- [ ] Verify audio recording/upload messages end to end
- [ ] Add message deletion UI and permissions

## LiveKit Calls

- [x] `@livekit/react-native`, LiveKit client, and WebRTC packages are installed
- [x] LiveKit Expo/plugin configuration exists in `app.json`
- [x] Edge Function source exists
- [x] LiveKit service invokes the Supabase Edge Function
- [x] `useCircleCall` hook manages room connection, participants, mic, and camera
- [x] Call screen renders participant grid and controls
- [~] Token request currently sends `circleId` and `userName`; verify Edge Function derives/authenticates user securely
- [~] Room join/leave and media controls are implemented but need device verification
- [ ] Deploy and verify the Edge Function with real LiveKit credentials
- [ ] Restrict token generation to valid Circle members
- [ ] Add E2EE key management
- [ ] Add call permission/error states for camera and microphone denial
- [ ] Remove debug logging from LiveKit token service

## Notifications

- [x] Notification service with fetch, mark-read, and realtime subscribe helpers
- [x] Notifications table migration with indexes, RLS, and Realtime publication
- [x] Notification permission screen exists
- [x] Real notifications list UI matching the provided design
- [x] Subscribe to notification inserts, updates, and deletes in the tab
- [x] Mark-one-read and mark-all-read flows
- [x] Create notifications for joiner interest, accepted members, almost-full Circles, Circle completion, and chat activity
- [~] Notification creation is client-triggered and should move server-side for stronger production security
- [~] Supabase notification migration exists but needs deployment verification
- [ ] Create notifications for moderation events
- [ ] Verify notification routing against real matched/Circle/message data
- [ ] Store Expo push tokens and add push delivery strategy

## Moderation and Admin

- [x] Moderator routes exist
- [x] Admin routes exist
- [x] Report service function exists
- [x] Ban/suspend service functions exist
- [~] Moderator dashboard exists but needs production functionality verification
- [~] Report detail route exists but needs production functionality verification
- [~] Admin dashboard and user management routes exist but need production functionality verification
- [ ] Build or verify reports list against real data
- [ ] Build or verify report resolution flow
- [ ] Build or verify admin user management actions
- [ ] Add unban/promote/demote actions if missing
- [ ] Add moderation audit log writes for every action

## Tooling and Docs

- [x] `ARCHITECTURE.md` documents target architecture
- [x] `PLAN.md` documents phased implementation plan
- [x] `README.md` describes current project status
- [x] `TODO.md` updated with current done/remaining work
- [x] `npm run lint` passes with zero errors
- [~] `ARCHITECTURE.md` is more optimistic than `README.md` and should be reconciled
- [~] 24 lint warnings remain for unrelated unused imports and hook dependencies
- [ ] Add automated tests for services and critical flows
- [ ] Add CI checks
- [ ] Add release/build instructions for EAS or native builds
- [ ] Update app identifiers from `com.anonymous.demoapp` / `demoapp` before production
