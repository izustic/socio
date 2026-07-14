# Sociol

Sociol is a mobile-first Expo React Native app for forming small in-person friend groups called Circles.

Users can either create a Circle as a host and swipe on people who fit the group, or join as a participant by swiping on Circles. When a Circle fills, the app is designed to unlock group chat, media sharing, and LiveKit-powered group calls.

## Current Stage

The project is in core app completion and product hardening.

Completed or mostly in place:

- Expo Router app structure
- Supabase Auth integration
- Supabase client with SecureStore session persistence
- User, Circle, swipe, message, notification, and moderation service files
- Onboarding flow screens
- Main tab shell
- Profile screen
- Host swipe logic
- Chat UI components
- Supabase Storage upload helpers
- Supabase Edge Function source for LiveKit token generation

Still in progress:

- Full Circle creation flow
- Joiner Circle swipe flow
- Realtime chat screen integration
- Notifications tab
- Admin/moderator dashboards
- LiveKit client integration
- Supabase migration files and deployment documentation
- Security cleanup around environment files

See `PLAN.md` and `TODO.md` for the current implementation roadmap.

## Tech Stack

- Expo 53
- React Native 0.79
- React 19
- Expo Router
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions
- LiveKit Cloud, planned for group calls
- Lottie for splash animation
- Lucide React Native for icons

## Project Structure

```text
socio/
├── app/                         Expo Router screens
│   ├── (auth)/                  Auth and onboarding flow
│   ├── (tabs)/                  Main app tabs
│   ├── circle/                  Circle creation, matching, chat, calls
│   ├── admin/                   Admin routes
│   └── moderator/               Moderator routes
├── src/
│   ├── components/              UI, onboarding, Circle, and chat components
│   ├── constants/               Theme and onboarding constants
│   ├── context/                 Auth and onboarding providers
│   ├── hooks/                   App hooks
│   ├── services/                Supabase-backed app services
│   ├── types/                   Shared TypeScript types
│   └── utils/                   Utility helpers
├── supabase/
│   └── functions/               Supabase Edge Functions
├── assets/                      Images and animations
├── ARCHITECTURE.md              Target architecture
├── PLAN.md                      Implementation plan
└── TODO.md                      Current task checklist
```

## Requirements

- Node.js
- npm
- Expo CLI through `npx expo`
- iOS Simulator, Android Emulator, or a physical device
- Supabase project
- LiveKit project, for call work

## Environment Variables

Create a local `.env` file in the project root:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-google-client-id

EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
```

Only variables prefixed with `EXPO_PUBLIC_` are safe to expose to the app bundle. LiveKit API secrets must stay backend-only and should be configured as Supabase Edge Function secrets for production use.

Google sign-in uses the native `@react-native-google-signin/google-signin` package on iOS and Android, so you need a development build rather than Expo Go. The web client ID is required because the native SDK mints the ID token against it, and Supabase verifies that audience.

Important: `.env` should not be committed. If it has already been committed, rotate any exposed secrets before using them in production.

### EAS builds (Android / iOS)

EAS cloud builds do **not** upload your local `.env` file. Configure the same `EXPO_PUBLIC_*` values as Expo project environment variables before building.

**Critical:** `EXPO_PUBLIC_*` variables must use **Plain text** or **Sensitive** visibility — **not Secret**. Secret variables stay on EAS servers and are **not** inlined into your JavaScript bundle, so `process.env.EXPO_PUBLIC_*` will be empty in the installed APK/IPA even though the variables appear in the Expo dashboard. Expo shows a warning about this when you use Secret visibility on `EXPO_PUBLIC_` names.

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co" --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key" --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your-web-client-id" --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "your-android-client-id" --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_LIVEKIT_URL --value "wss://your-project.livekit.cloud" --environment preview --environment production --visibility plaintext
```

If you already created them as Secret, delete and recreate each one with Plain text or Sensitive visibility (or edit visibility in the Expo dashboard if available).

Then rebuild:

```bash
eas build --platform android --profile preview
```

**Google Sign-In on Android EAS builds:** the APK/AAB is signed with EAS credentials, not your local debug keystore. Add the EAS keystore SHA-1 fingerprint to the Android OAuth client in Google Cloud Console (`com.izustic.socio`). Get it with:

```bash
eas credentials -p android
```

Without the correct SHA-1, Google sign-in fails on device builds even when it works locally.

## Install

```bash
npm install
```

## Run

Start the Expo dev server:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on web:

```bash
npm run web
```

## Lint

```bash
npm run lint
```

Current status: lint exits with zero errors. Some warnings remain for unused imports, hook dependencies, and array type style cleanup.

## Backend Setup Notes

The target schema and policies are documented in `ARCHITECTURE.md`.

Before treating a Supabase environment as production-ready, verify:

- `users`, `circles`, `circle_pending`, `messages`, `notifications`, `reports`, and `moderation_logs` tables exist
- RLS is enabled on protected tables
- policies match the expected app access model
- `avatars` and `chat-media` buckets exist
- storage policies match the media access model
- LiveKit secrets are set on the Supabase Edge Function
- `get-livekit-token` is deployed and restricted to valid Circle members

## Useful Commands

```bash
npm run lint
npm run start
npm run android
npm run ios
npm run web
```

## Documentation

- `ARCHITECTURE.md`: target system architecture
- `PLAN.md`: phased implementation plan
- `TODO.md`: current checklist of done and remaining work

## Known Gaps

- The README and plan now reflect the Supabase-only direction, but committed Supabase SQL migrations are still missing.
- Several screens are placeholders.
- LiveKit client methods currently need real implementation.
- `.env` security needs cleanup before production use.
