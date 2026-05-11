# Socio TODO

Updated: May 2026

Legend:

- `[x]` done in the current codebase
- `[~]` partially implemented
- `[ ]` still to do

## Foundation

- [x] Expo Router app scaffold
- [x] Native iOS and Android folders generated
- [x] Shared theme constants
- [x] Core UI components: Button, Input, Chip, Avatar
- [x] Circle UI components: ProfileCard, CircleCard, CircleProgress, MemberRow, CapacityBadge
- [x] Chat UI components: ChatInput, MessageBubble, MediaMessage
- [x] Onboarding UI components: OnboardingLayout, StepIndicator, MediaGrid
- [x] Lottie splash screen
- [ ] Remove duplicate starter-era components under top-level `components/` if no longer used
- [ ] Reduce lint warnings from unused imports and hook dependency warnings

## Supabase Backend

- [x] Supabase client configured
- [x] SecureStore auth persistence
- [x] Supabase Auth service
- [x] User profile service
- [x] Circle service
- [x] Swipe/matching service
- [x] Message service with realtime subscription
- [x] Notification service with realtime subscription
- [x] Moderation service skeleton
- [x] Storage upload helpers for avatars and chat media
- [x] LiveKit token Edge Function folder exists
- [ ] Add committed Supabase SQL migrations/schema files
- [ ] Verify tables match `ARCHITECTURE.md`
- [ ] Verify RLS policies in Supabase dashboard
- [ ] Verify `avatars` and `chat-media` buckets and policies
- [ ] Confirm Edge Function deployment process

## Security

- [ ] Stop tracking `.env`
- [ ] Add `.env` to `.gitignore`
- [ ] Add `.env.example`
- [ ] Rotate any credentials that were committed or shared
- [ ] Confirm LiveKit secrets are backend-only
- [ ] Enforce role checks in Supabase policies, not just UI
- [ ] Confirm banned/suspended users are blocked consistently

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
- [ ] Verify real Supabase OTP behavior
- [ ] Verify Google OAuth behavior
- [ ] Verify Facebook OAuth behavior
- [ ] Request and store Expo notification permission/token
- [ ] Add media reordering and main-photo selection
- [ ] Add form validation and user-facing error states

## Main App Shell

- [x] Root stack layout
- [x] Auth provider wrapped around app
- [x] Bottom tabs: Circle, Swipe, Alerts, Profile
- [x] App entry redirect based on auth/profile/role status
- [x] Banned screen
- [x] Suspended screen
- [~] Circle home tab
- [~] Swipe tab
- [~] Profile tab
- [ ] Replace placeholder Notifications tab
- [ ] Consolidate auth/role redirect logic between `app/index.tsx` and layouts
- [ ] Add polished loading, empty, and error states

## Profile

- [x] Profile screen reads current auth/profile data
- [x] Edit profile route exists
- [~] Edit profile screen
- [ ] Finish edit profile form fields
- [ ] Add save actions and validation
- [ ] Support profile media updates
- [ ] Support notification/location preference updates

## Circle Creation

- [x] Circle create service function
- [x] `app/circle/create-circle.tsx` exists
- [x] `app/circle/create-preferences.tsx` route exists
- [~] Create Circle UI
- [ ] Consolidate `create.tsx` and `create-circle.tsx`
- [ ] Finish name/vibe/size/radius/meetup details
- [ ] Finish host preference setup
- [ ] Persist all Circle fields expected by the schema
- [ ] Route users correctly after Circle creation

## Host Swipe Flow

- [x] Host swipe route exists
- [x] Candidate loading from Supabase
- [x] Like/pass submission service
- [x] Circle progress route exists
- [x] Circle complete route exists
- [~] Match feedback
- [ ] Prioritize joiners who liked the Circle
- [ ] Verify full Circle completion behavior
- [ ] Add empty deck screen behavior
- [ ] Add integration checks for membership updates

## Joiner Flow

- [x] Join preferences route exists
- [x] Swipe Circles route exists
- [~] Service support for pending joiners
- [ ] Build full Join Preferences UI
- [ ] Build full Swipe Circles UI
- [ ] Implement joiner-like-circle flow
- [ ] Implement mutual-like flow
- [ ] Add joiner notifications
- [ ] Route matched joiner into Circle dashboard/chat

## Chat and Media

- [x] Message service
- [x] Realtime message subscription helper
- [x] Chat route exists
- [x] Chat components exist
- [x] Media upload hooks exist
- [~] Chat screen
- [ ] Wire chat components into live chat screen
- [ ] Enforce chat access only for complete Circles and members
- [ ] Add image upload messages
- [ ] Add video upload messages
- [ ] Add audio upload messages
- [ ] Add message deletion UI and permissions
- [ ] Add realtime match/Circle activity notifications

## LiveKit Calls

- [x] Edge Function source exists
- [x] `useCircleCall` hook exists
- [~] LiveKit service file exists
- [ ] Install `@livekit/react-native`
- [ ] Install `@livekit/react-native-webrtc`
- [ ] Implement token generation through Supabase Edge Function
- [ ] Implement room join/leave
- [ ] Implement mic/camera controls
- [ ] Build real call screen
- [ ] Add E2EE support

## Moderation and Admin

- [x] Moderator routes exist
- [x] Admin routes exist
- [x] Report service function exists
- [x] Ban/suspend service functions exist
- [~] Moderator dashboard
- [~] Admin dashboard
- [ ] Build reports list
- [ ] Build report detail screen
- [ ] Implement resolve report flow
- [ ] Build admin user management
- [ ] Add unban/promote/demote actions
- [ ] Add audit log writes

## Tooling and Docs

- [x] `ARCHITECTURE.md` documents target architecture
- [x] `PLAN.md` updated for Supabase-only codebase
- [x] `TODO.md` updated with current done/remaining work
- [x] `README.md` replaced with project-specific documentation
- [x] `npm run lint` has zero errors
- [ ] Resolve remaining lint warnings
- [ ] Add tests
- [ ] Add CI checks
- [ ] Add release/build instructions for EAS or native builds
