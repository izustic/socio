# Socio TODO

Derived from [ARCHITECTURE.md](/Users/escuser/Documents/izu/socio/ARCHITECTURE.md).

Legend:
- `~~crossed out~~` = clearly implemented in the codebase
- `[~]` = partially implemented / basic version exists
- `[ ]` = still to do

## 1. Foundation

- ~~Set up Firebase Auth~~
- ~~Set up Firestore app data layer~~
- ~~Create basic Expo Router navigation~~
- ~~Create shared theme tokens and core UI primitives (`Button`, `Input`, `Chip`, `Avatar`)~~
- ~~Add Lottie splash screen~~
- [ ] Split constants into the exact architecture shape (`colors.ts`, `typography.ts`, `theme.ts`) if desired

## 2. Onboarding & Auth

- ~~Build sign-up / welcome screen~~
- [ ] Add true phone-number OTP verification with Firebase instead of placeholder OTP progression
- ~~Build OTP screen UI~~
- ~~Build location permission screen~~
- ~~Build notifications permission screen UI~~
- [ ] Wire real Expo Notifications permission request and token handling
- ~~Build onboarding intro screen~~
- ~~Build profile photo + name step~~
- [ ] Wire real media picking for onboarding photos/videos
- [ ] Support up to 5 onboarding media items with reordering and main-photo selection
- ~~Build age + gender step~~
- ~~Build interests step~~
- ~~Build traits step~~
- ~~Build profile complete screen~~
- ~~Persist onboarding draft state across steps~~
- ~~Redirect incomplete users back into onboarding until profile completion~~

## 3. Profile Data

- ~~Create user profile documents in Firestore~~
- ~~Store profile fields including interests, traits, bio, and completion state~~
- [ ] Align Firestore user profile exactly with architecture fields (`city` top-level, media-ready shape if needed)
- [ ] Build `EditProfileScreen`
- [ ] Add header `Save` action for edit profile
- [ ] Add bottom `Save` button for edit profile
- [ ] Mirror onboarding fields fully in edit profile

## 4. Main App Shell

- [ ] Build final bottom navigation with `Home`, `Swipe`, `Notifications`, `Profile`
- [~] Home / swipe entry screen exists
- [ ] Build final `NoCircleScreen` empty state with both `Create a Circle` and `Join a Circle`
- [~] Active circle / progress dashboard exists
- [ ] Build final `ProfileScreen`
- [ ] Build final `NotificationsScreen`

## 5. Create-a-Circle Flow (Host)

- [~] Build basic `CreateCircleScreen`
- [ ] Expand `CreateCircleScreen` to full stage-1 spec: name, vibe, size, radius, meetup details
- [ ] Build `CreateCirclePreferencesScreen`
- [~] Build host `SwipeScreen`
- [~] Build `CircleProgressScreen`
- [ ] Build dedicated `CircleCompleteScreen`
- [~] Route complete circles into chat flow

## 6. Join-a-Circle Flow (Joiner)

- [ ] Build `JoinCirclePreferencesScreen`
- [ ] Build `SwipeCirclesScreen`
- [ ] Implement joiner-like-circle flow
- [ ] Prioritize joiner likes in host swipe deck
- [ ] Add mutual-like flow that inserts joiner into circle

## 7. Edge & Empty States

- [ ] Build `SwipeEmptyScreen`
- [ ] Build generic `EdgeStatesScreen`
- [ ] Add polished error / empty-state treatments across onboarding, circle, and chat flows

## 8. Chat & Communication

- [~] Build basic circle chat screen for text flow
- [ ] Ensure chat unlock is enforced only when a circle is complete
- [ ] Build `MessageBubble` component
- [ ] Build `ChatInput` component
- [ ] Build `MediaMessage` component
- [ ] Add notifications feed for match alerts and circle activity

## 9. Media Architecture

- [ ] Install and configure Supabase Storage
- [ ] Create `avatars` bucket
- [ ] Create `chat-media` bucket
- [ ] Implement `src/services/supabase.ts`
- [ ] Implement avatar upload
- [ ] Implement chat image upload
- [ ] Implement chat video upload
- [ ] Implement chat audio upload
- [ ] Create `useImageUpload` hook
- [ ] Create `useMediaUpload` hook
- [ ] Enforce media file size limits before upload
- [ ] Store Supabase media URLs in Firestore docs

## 10. Location Services

- [~] Implement basic Expo Location service
- [~] Implement reverse geocoding flow
- [ ] Extract dedicated `src/services/nominatimService.ts`
- [ ] Create `src/hooks/useLocation.ts`
- [ ] Add reusable Haversine utility under `src/utils/locationUtils.ts`
- [ ] Use distance filtering throughout circle discovery / matching

## 11. Supabase Roles & Moderation Backend

- [ ] Create Supabase project
- [ ] Add `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Add `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Run PostgreSQL schema from architecture
- [ ] Enable RLS on all required tables
- [ ] Add Supabase storage policies
- [ ] Sync Firebase users into Supabase on login
- [ ] Fetch role and status from Supabase after login
- [ ] Upgrade `AuthContext` to full role/status model

## 12. Role-Based Navigation

- [ ] Redirect admins to admin dashboard
- [ ] Redirect moderators to moderator dashboard
- [ ] Block banned users behind a banned wall
- [ ] Enforce suspended/banned behavior consistently across app entry

## 13. Moderation Features

- [ ] Implement `src/services/moderation.ts`
- [ ] Add `reportUser`
- [ ] Add pending reports query
- [ ] Add report resolution flow
- [ ] Add ban user action
- [ ] Add suspend user action
- [ ] Add unban user action
- [ ] Add promote user action
- [ ] Add demote user action
- [ ] Log all moderation actions to audit log
- [ ] Build `moderator/dashboard.tsx`
- [ ] Build `moderator/report-detail.tsx`
- [ ] Build `admin/dashboard.tsx`
- [ ] Build `admin/user-management.tsx`

## 14. LiveKit Calls

- [ ] Install LiveKit packages
- [ ] Create `src/services/livekit.ts`
- [ ] Create `src/hooks/useCircleCall.ts`
- [ ] Store per-circle `callKey` in Firestore
- [ ] Build call UI / screen
- [ ] Enable E2EE group call flow

## 15. Firebase Cloud Functions

- [ ] Add `functions/` project
- [ ] Implement `getLivekitToken` callable function
- [ ] Configure LiveKit secrets in Firebase Functions config
- [ ] Deploy cloud functions

## 16. Firestore Data Model Alignment

- [~] Users collection exists
- [~] Circles collection exists
- [~] Circle messages collection exists
- [ ] Add full message model support for `text | image | video | audio`
- [ ] Add `mediaUrl`, `mediaSize`, and `mediaDuration` fields where needed
- [ ] Ensure circle docs include final `callKey`, `meetupGoal`, and full filter shape consistently

## 17. Folder Structure Alignment

- [ ] Add `src/services/supabase.ts`
- [ ] Add `src/services/moderation.ts`
- [ ] Add `src/services/livekit.ts`
- [ ] Add `src/hooks/useAuth.ts` if still desired separately from context
- [ ] Add `src/hooks/useRole.ts`
- [ ] Add `src/hooks/useImageUpload.ts`
- [ ] Add `src/hooks/useMediaUpload.ts`
- [ ] Add `src/hooks/useCircleCall.ts`
- [ ] Add `src/hooks/useLocation.ts`
- [ ] Add `src/components/circle/ProfileCard.tsx`
- [ ] Add `src/components/circle/CircleProgress.tsx`
- [ ] Add `src/components/circle/MemberRow.tsx`
- [ ] Add `src/components/chat/MessageBubble.tsx`
- [ ] Add `src/components/chat/MediaMessage.tsx`
- [ ] Add `src/components/chat/ChatInput.tsx`
- [ ] Add `src/utils/locationUtils.ts`
- [ ] Add `src/utils/nominatimService.ts`
- [ ] Add `functions/index.js`
- [ ] Add `functions/package.json`

## 18. Packages & Native Capabilities

- [ ] Install `@supabase/supabase-js`
- [ ] Install `expo-image-picker`
- [ ] Install `expo-document-picker`
- ~~Install `expo-location`~~
- [ ] Install `expo-notifications`
- [ ] Install `@livekit/react-native`
- [ ] Install `@livekit/react-native-webrtc`
- ~~Install `lottie-react-native`~~
- [ ] Run `npx expo install --fix` after package alignment

## 19. Security Checklist

- [ ] Use Firebase UID as the single identity source across all services
- [ ] Enable Supabase RLS policies on all tables
- [ ] Keep LiveKit API secret only in Firebase Cloud Functions
- [ ] Restrict Firestore `callKey` reads to circle members
- [ ] Enforce media size limits before upload
- [ ] Enforce role checks in both frontend and backend
- [ ] Block banned users before any app screen loads
- [ ] Write all moderation actions to audit log
- [ ] Ensure `.env` itself is ignored in git

## 20. Implementation Order Check

- ~~Phase 1 — Foundation~~
- [ ] Phase 2 — Supabase
- [~] Phase 3 — Onboarding UI
- [~] Phase 4 — Core App
- [ ] Phase 5 — Chat + Media
- [ ] Phase 6 — Calls
- [ ] Phase 7 — Moderation
