# SOCIO - IMPLEMENTATION PLAN

> Version 2.0
> Last updated: May 2026
> Source of truth: `ARCHITECTURE.md` plus the current codebase
> Current stage: Core app completion and product hardening

## Project Summary

Socio is an Expo React Native app for forming small in-person friend groups called Circles. Users can create a Circle as a host, swipe on people who fit the Circle, or join as a participant by swiping on Circles. When a Circle fills, the app should unlock group chat, media sharing, and eventually LiveKit-powered group calls.

The project has migrated from the older Firebase-oriented plan to a Supabase-only backend:

- Supabase Auth for identity
- Supabase PostgreSQL for users, circles, swipes, messages, notifications, reports, and roles
- Supabase Storage for avatars and chat media
- Supabase Realtime for live chat/notifications
- Supabase Edge Functions for LiveKit token generation
- LiveKit Cloud for realtime group calls

## Current Status

The app is past the initial scaffold and basic onboarding stage. Supabase service files, Expo Router screens, onboarding state, role hooks, Circle services, swipe logic, chat components, and moderation service entry points exist.

The project is not final-product complete yet. Several routes are placeholders, LiveKit client integration is still stubbed, and some planning docs previously described older Firebase-era work. This plan reflects the actual codebase as of May 2026.

## Phase 1 - Foundation

Status: Complete

- [x] Expo app scaffolded
- [x] Expo Router installed and used for file-based routing
- [x] Native iOS and Android projects generated
- [x] Shared theme/constants created
- [x] Core UI primitives created: Button, Input, Chip, Avatar, StepIndicator, MediaGrid
- [x] Lottie splash component added
- [x] Main folders established: `app`, `src`, `assets`, `supabase`

## Phase 2 - Supabase Migration

Status: Mostly complete

- [x] `@supabase/supabase-js` installed
- [x] Supabase client created in `src/services/supabase.ts`
- [x] SecureStore auth persistence adapter added
- [x] Auth service migrated to Supabase Auth
- [x] User profile service uses Supabase tables
- [x] Circle service uses Supabase tables
- [x] Messages service uses Supabase tables and Realtime subscriptions
- [x] Notifications service uses Supabase tables and Realtime subscriptions
- [x] Moderation service entry points created
- [x] Avatar and chat media upload helpers created
- [x] Supabase Edge Function folder created for LiveKit tokens
- [ ] Confirm deployed Supabase schema, RLS policies, and storage buckets match `ARCHITECTURE.md`
- [ ] Remove or rotate any committed secrets and make sure `.env` is ignored
- [ ] Add database migration files or SQL scripts under `supabase/`

## Phase 3 - Auth and Onboarding

Status: Mostly complete

- [x] Welcome screen exists
- [x] Email signup screen exists
- [x] Login screen exists
- [x] OTP screen exists
- [x] Location permission screen exists
- [x] Notifications permission screen exists
- [x] Onboarding intro exists
- [x] Profile photo/name step exists
- [x] Age/gender step exists
- [x] Interests step exists
- [x] Traits step exists
- [x] Profile complete screen exists
- [x] Onboarding context persists multi-step draft state
- [x] Incomplete profiles are redirected through onboarding
- [ ] Verify phone OTP against real Supabase phone auth in device builds
- [ ] Verify OAuth flows for Google and Facebook
- [ ] Wire real Expo Notifications permission/token handling
- [ ] Finish onboarding media upload/reorder/main-photo behavior
- [ ] Add robust onboarding error and loading states

## Phase 4 - Main App Shell and Profile

Status: In progress

- [x] Bottom tab layout exists: Circle, Swipe, Alerts, Profile
- [x] Auth-based app entry redirect exists in `app/index.tsx`
- [x] Banned and suspended screens exist
- [x] Profile screen displays live auth/profile data
- [x] Edit profile route exists
- [x] Role hook exists for user/moderator/admin state
- [ ] Move role-based redirects into a single consistent route guard strategy
- [ ] Finish Notifications tab with real notification data
- [ ] Clean up placeholder tab/screen content
- [ ] Finish profile editing, save actions, validation, and media updates
- [ ] Add empty/error/loading states across all main tabs

## Phase 5 - Circle Creation and Matching

Status: In progress

- [x] Circle service supports create, update, membership, pending joiners, and subscriptions
- [x] Host swipe screen has real candidate-loading and swipe submission logic
- [x] Circle dashboard/progress screens exist
- [x] No-circle and empty-state routes exist
- [x] Circle card/profile card components exist
- [ ] Consolidate duplicate/overlapping Circle creation routes
- [ ] Finish full Create Circle stage 1: name, vibe, size, radius, meetup details
- [ ] Finish Create Circle preferences
- [ ] Finish Join Circle preferences
- [ ] Finish Joiner Swipe Circles screen
- [ ] Complete mutual-like flow that adds joiners to Circles
- [ ] Enforce distance/preference filtering in discovery
- [ ] Add tests or integration checks for matching and membership behavior

## Phase 6 - Chat and Media

Status: Partially implemented

- [x] Messages service supports send, fetch, delete, and subscribe
- [x] Chat UI components exist: ChatInput, MessageBubble, MediaMessage
- [x] Chat route exists
- [x] Media upload hooks exist
- [x] Supabase upload helpers enforce basic file-size limits
- [ ] Wire ChatInput/MessageBubble/MediaMessage into the chat screen
- [ ] Enforce chat unlock only when a Circle is complete
- [ ] Add image/video/audio picking for chat messages
- [ ] Store and render full media metadata
- [ ] Add realtime notification events for matches and Circle activity

## Phase 7 - LiveKit Calls

Status: Not implemented on client

- [x] Supabase Edge Function folder exists for `get-livekit-token`
- [x] LiveKit service and hook files exist
- [ ] Install and configure LiveKit React Native packages
- [ ] Replace `src/services/livekit.ts` stubs with real Supabase function invocation and room connection
- [ ] Build real call UI
- [ ] Add E2EE key management
- [ ] Restrict call access to Circle members
- [ ] Deploy and verify the Supabase Edge Function

## Phase 8 - Moderation and Admin

Status: Service skeleton plus placeholder screens

- [x] Moderation service exists
- [x] Report, suspend, and ban service functions exist
- [x] Admin and moderator routes exist
- [x] Admin and moderator dashboard placeholders exist
- [ ] Build moderator report queue
- [ ] Build report detail and resolution flow
- [ ] Build admin user management
- [ ] Add promote/demote/unban flows
- [ ] Write moderation audit logs for every action
- [ ] Enforce role checks in both UI and Supabase policies

## Phase 9 - Quality, Security, and Release Readiness

Status: Needs work

- [x] `npm run lint` exits with zero errors
- [ ] Reduce remaining lint warnings
- [ ] Add automated tests for services and critical flows
- [ ] Add database migration/versioning process
- [ ] Confirm `.env` is untracked and ignored
- [ ] Validate Supabase RLS policies in a real project
- [ ] Validate storage access policies for private media
- [ ] Add crash/error reporting strategy
- [ ] Create release checklist for iOS and Android
- [ ] Update app metadata, icons, and production environment setup

## Next Recommended Work

1. Secure the repository: untrack `.env`, rotate exposed keys if needed, and commit an `.env.example`.
2. Finish Circle creation and joiner swipe flows so the core product loop works end to end.
3. Wire the chat components into `app/circle/chat.tsx` with realtime messages and media.
4. Replace placeholder admin/moderator/notification screens with real data-backed screens.
5. Implement LiveKit only after the Circle/chat loop is reliable.
