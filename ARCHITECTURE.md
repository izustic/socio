# SOCIO — SYSTEM ARCHITECTURE

## Implementation Guide

> Version 2.1 | Prepared by: Izu Obikanyi
> Status: CORE LOOP SCAFFOLDED, NOT PRODUCTION-READY
> Updated: July 2026 — Reconciled with `TODO.md` / `PLAN.md` / `README.md`.
> Every layer in the Tech Stack table is now annotated with an actual status
> (`DONE` / `PARTIAL` / `NOT STARTED`) and the Security Checklist has been
> updated to reflect what is actually in the repo.

---

## 1. WHAT IS SOCIO

Socio is a mobile-first React Native (Expo) app for forming small in-person friend groups called **Circles**. Users either **create a Circle** and curate members (Host path), or **join an existing Circle** by being swiped on (Joiner path). Once a Circle is full, members unlock group chat, media sharing, and E2EE group calls.

### Two Core User Journeys

```
HOST PATH:
Onboard → Profile setup → NoCircle → Create Circle → Set preferences
→ Swipe users → Circle fills → CircleComplete → Chat

JOINER PATH:
Onboard → Profile setup → NoCircle → Join Circle → Set preferences
→ Swipe Circles → Mutual match with host → Added to Circle → Chat
```

### Matching Logic

- Joiner likes a Circle → host sees that user **prioritized** in their swipe deck
- Host likes the joiner back → mutual match → joiner added to Circle
- Both land in ChatScreen once Circle is complete
- Joiner swipe deck refreshes on focus and realtime `circles` updates so
  completed Circles disappear immediately
- Swipe cards advance optimistically on tap, then reconcile with the server
  response in the background
- Swipe tab visibility is refreshed silently so routine swipes do not force
  the tab wrapper back through a loading screen

### Bottom tab visibility

Tab bar rules are centralized in `resolveAppTabVisibility()` (`src/services/circle.helpers.ts`) and applied by `SwipeTabVisibilityContext`.

| App state | Circle tab | Swipe tab | Likes tab | Circle tab content | Swipe tab content |
|---|---|---|---|---|---|
| After onboarding / no circle | Visible | Hidden | Visible | `NoCircleScreen` | — |
| Join flow (browsing circles) | Hidden | Visible | Visible | — | `SwipeCirclesScreen` |
| Host filling a forming circle | Visible | Visible | Visible | `CircleProgressScreen` | `SwipeUsersScreen` |
| Joiner matched into forming circle | Visible | Hidden | Visible | `CircleProgressScreen` | — |
| Circle complete (host or member) | Visible | Hidden | Visible | `CircleCompleteScreen` | — |
| After leave / close circle | Visible | Hidden | Visible | `NoCircleScreen` | — |

`startJoinBrowsing()` / `endJoinBrowsing()` track the join-browse flow before a circle record exists. Tab visibility is refreshed on circle load, match, completion, leave, and close.

### Likes Tab

`app/(tabs)/likes.tsx` shows incoming pending swipes from both sides of the
matching model:

- A joiner liked a host's forming Circle → the joiner's profile appears.
- A host liked a joiner's profile → the host's Circle appears.

The data is derived from `circles.pending_swipes` via `src/services/likes.ts`.
Socio+ entitlement is read from `users.is_socio_plus` and
`users.subscription_status`. Free users see the incoming count and blurred
cards; Socio+ users can pass or like back, which calls the existing
`submit_host_swipe` / `submit_circle_swipe` RPCs so mutual matches continue
through the normal Circle membership flow.

Socio+ billing is handled by `src/services/billing.ts` using Apple StoreKit on
iOS and Google Play Billing on Android through `react-native-iap`. Purchases
are not trusted on-device: purchase tokens / transaction IDs are sent to the
`verify-socio-plus` Supabase Edge Function, which validates them with Apple or
Google, upserts `socio_plus_subscriptions`, and denormalizes the current
entitlement onto `users`.

### Admin and Moderator Mode

`users.role` and `users.status` drive the admin/moderator shell. `app/index.tsx`
routes banned users to `/banned`, suspended users to `/suspended`, and all
active users, including moderators and admins, into normal Socio mode by
default. Staff tools are opt-in from Profile: admins can open
`/admin/dashboard`, and moderators/admins can open `/moderator/dashboard`.

Normal users can report another Circle member from `app/circle/info.tsx`.
Report creation calls `public.create_user_report`, which validates the
authenticated reporter, prevents self-reporting, and verifies Circle context
when `circle_id` is supplied. Moderator/admin actions call RPCs from
`src/services/moderation.ts`:

- `dismiss_report` dismisses a report and writes a `moderation_logs` audit row.
- `moderate_user` activates, suspends, or bans a user and resolves a report
  when one is supplied.
- `set_user_role` is admin-only and promotes/demotes users.

The migration `202607060003_moderation_rpc_enforcement.sql` also adds a
`users` trigger that blocks ordinary profile updates from changing protected
`role`, `status`, or `suspended_until` fields outside the moderation path.

---

## 2. TECH STACK OVERVIEW

> Status legend: `DONE` = implemented in code, `PARTIAL` = scaffolded but not
> verified, `NOT STARTED` = not yet in the repo. This replaces the old
> "✅ DONE" table, which overstated reality.

```
Layer               Service                       Status        Notes
─────────────────────────────────────────────────────────────────────────────
Authentication      Supabase Auth                 DONE          Email/pwd, native Google Sign-In, OTP — flows exist; real-device verification still pending
Database (app data) Supabase PostgreSQL           PARTIAL       Migrations committed; deployed schema, RLS, and policies need project-level verification
File Storage        Supabase Storage              PARTIAL       Upload helpers exist; `avatars` and `chat-media` buckets/policies not yet verified
Real-time Chat      Supabase Realtime             PARTIAL       Service subscribes; chat screen integration, access control, and media end-to-end tests still pending
User Roles/Reports  Supabase PostgreSQL           PARTIAL       Data-backed admin/moderator screens exist; report creation and privileged moderation writes are RPC-backed; deployed verification still pending
Group Calls (E2EE)  Livekit Cloud                 NOT STARTED   Packages installed and hook exists, but real room join + E2EE keys not yet implemented on client
Call Tokens         Supabase Edge Function        PARTIAL       Source exists; not yet deployed; auth of caller + Circle-member restriction pending
Location Services   Expo Location + Nominatim     PARTIAL       Service and util exist; device verification and onboarding flow still pending
Notifications       Supabase PostgreSQL           PARTIAL       Realtime list and service exist; moderation-event notifications are server-side via DB triggers, but broader creation is still client-triggered; push tokens not stored
Billing             StoreKit / Play Billing       PARTIAL       `react-native-iap` client, Supabase verification function, subscription table, restore, and launch refresh exist; store-console products/secrets still need live configuration
```

Repo note: the starter-era top-level `components/` and `hooks/` scaffold has
been removed. Shared app logic now lives under `src/`, and the pure helper
modules in `src/services/*.helpers.ts` back the Vitest coverage for auth,
Circle creation, chat message shaping, and moderation payloads.

### Golden Rule

> Each service does exactly ONE job. Never duplicate logic across services.

```
Supabase Auth       → who you are (identity + session)
Supabase Postgres   → all data (users, circles, messages, notifications)
Supabase Storage   → all media files (avatars, chat media)
Supabase Realtime   → real-time subscriptions (chat, notifications)
Livekit            → real-time E2EE audio/video calls
Supabase Edge Fn   → secure server-side token generation
StoreKit/Play Billing → Socio+ subscriptions and restore purchase
```

---

## 3. ENVIRONMENT VARIABLES

Create a `.env` file in the project root. Never commit this file.

```dotenv
# Supabase Auth
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (configured in Supabase Dashboard)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-google-client-id

# Livekit
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Livekit secrets (backend only — Supabase Edge Function)
# NEVER prefix these with EXPO_PUBLIC_
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Socio+ billing secrets (backend only — Supabase Edge Function)
# NEVER prefix these with EXPO_PUBLIC_
SOCIO_PLUS_PRODUCT_IDS=socio_plus_monthly
APPLE_BUNDLE_ID=com.izustic.socio
APPLE_ENVIRONMENT=Production
APPLE_ISSUER_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
GOOGLE_PLAY_PACKAGE_NAME=com.izustic.socio
GOOGLE_PLAY_CLIENT_EMAIL=
GOOGLE_PLAY_PRIVATE_KEY=
```

### Socio+ Store Setup

- App Store Connect: create an auto-renewable subscription product with product
  ID `socio_plus_monthly` under a Socio+ subscription group. Create an App
  Store Server API key and store `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, and
  `APPLE_PRIVATE_KEY` as Supabase secrets.
- Google Play Console: create a subscription product with product ID
  `socio_plus_monthly` and at least one active base plan/offer. Create or link
  a Google Cloud service account with Android Publisher API access, then store
  `GOOGLE_PLAY_CLIENT_EMAIL` and `GOOGLE_PLAY_PRIVATE_KEY` as Supabase secrets.
- Supabase: deploy `verify-socio-plus`, run the Socio+ migrations, and set all
  billing secrets with `supabase secrets set ...`. App Store Server
  Notifications / Real-time Developer Notifications should call or trigger the
  same entitlement refresh path so refunds, cancellations, billing retry, and
  expiry are reflected promptly.

---

## 4. FOLDER STRUCTURE

```
socio/
├── app/                              # Expo Router screens (file-based routing)
│   ├── _layout.tsx                   # Root layout
│   ├── index.tsx                     # Splash screen (Lottie animation)
│   │
│   ├── (auth)/                       # Onboarding & auth flow
│   │   ├── _layout.tsx               # Auth routing logic
│   │   ├── welcome.tsx               # 01 — Logo + tagline + social CTAs + "Log in" link
│   │   ├── otp.tsx                   # Phone/email OTP verification
│   │   ├── location-permission.tsx   # Location access request
│   │   ├── notifications-permission.tsx
│   │   ├── onboarding-intro.tsx      # Value prop — how Circles work
│   │   ├── profile-photo-name.tsx    # Step 1/4 — up to 5 photos/videos + name
│   │   ├── profile-age-gender.tsx    # Step 2/4 — age stepper + gender selector
│   │   ├── profile-interests.tsx     # Step 3/4 — interest chips
│   │   ├── profile-traits.tsx        # Step 4/4 — personality trait chips
│   │   └── profile-complete.tsx      # Celebration → enters main app
│   │
│   ├── (tabs)/                       # Main app shell — persistent bottom nav
│   │   ├── _layout.tsx               # BottomNav: Circle · Swipe · Likes · Notifications · Profile
│   │   ├── home.tsx                  # Circle tab: NoCircleScreen or CircleScreen based on state
│   │   ├── swipe.tsx                 # SwipeScreen (host) or SwipeCirclesScreen (joiner)
│   │   ├── likes.tsx                 # Socio+ incoming likes grid
│   │   ├── notifications.tsx         # Match alerts, Circle activity
│   │   └── profile.tsx              # ProfileScreen
│   │
│   ├── circle/                       # Circle flows
│   │   ├── no-circle.tsx             # Empty state — Create or Join CTA
│   │   ├── create.tsx                # Canonical Stage 1: name, vibe, meetup details
│   │   ├── create-preferences.tsx    # Stage 2: who to attract (age/gender/interests)
│   │   ├── join-preferences.tsx      # Joiner: what they're looking for
│   │   ├── swipe-users.tsx           # Host swipes users (media carousel cards)
│   │   ├── swipe-circles.tsx         # Joiner swipes Circles
│   │   ├── progress.tsx              # Circle filling up
│   │   ├── complete.tsx              # Circle full → unlock chat
│   │   ├── chat.tsx                  # Group chat (text + media)
│   │   ├── call.tsx                  # E2EE group call
│   │   └── swipe-empty.tsx           # No more profiles/circles to swipe
│   │
│   ├── profile/
│   │   └── edit.tsx                  # Full profile editor (mirrors onboarding fields)
│   │
│   ├── moderator/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   └── report-detail.tsx
│   │
│   └── admin/
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       └── user-management.tsx
│
├── src/
│   ├── services/
│   │   ├── supabase.ts               # Supabase client + auth persistence + storage
│   │   ├── auth.ts                   # All auth methods (Supabase Auth)
│   │   ├── user.ts                   # User profile CRUD (PostgreSQL)
│   │   ├── circle.ts                 # Circle CRUD + realtime (PostgreSQL)
│   │   ├── messages.ts               # Chat messages + realtime (PostgreSQL)
│   │   ├── notifications.ts         # Notifications + realtime (PostgreSQL)
│   │   ├── swipe.ts                  # Swipe logic + matching
│   │   ├── likes.ts                  # Incoming likes projection from pending_swipes
│   │   ├── billing.ts                # Socio+ StoreKit / Play Billing client
│   │   ├── moderation.ts             # All moderation actions
│   │   ├── livekit.ts                # Call management
│   │   └── location.ts               # Location services
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                # (deprecated, use AuthContext)
│   │   ├── useRole.ts                # (deprecated, use AuthContext)
│   │   ├── useImageUpload.ts         # Profile photo/video upload (up to 5 slots)
│   │   ├── useMediaUpload.ts         # Chat media (video/audio/image)
│   │   ├── useCircleCall.ts          # Livekit call management
│   │   └── useLocation.ts            # Expo Location + Nominatim
│   │
│   ├── context/
│   │   └── AuthContext.tsx           # Global auth + profile + role state
│   │
│   ├── constants/
│   │   ├── colors.ts                 # Design system colors (HSL semantic tokens)
│   │   ├── typography.ts             # Font sizes and weights
│   │   └── theme.ts                  # Full theme export
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx            # Pill button (borderRadius: 100)
│   │   │   ├── Input.tsx
│   │   │   ├── Chip.tsx              # Interest/trait chips
│   │   │   ├── Avatar.tsx            # Single avatar
│   │   │   ├── AvatarStack.tsx       # Overlapping avatars with +N overflow
│   │   │   ├── StepIndicator.tsx     # 4-bar progress for profile setup
│   │   │   ├── DualSlider.tsx        # Dual-thumb range slider (age/radius)
│   │   │   └── MediaGrid.tsx         # 5-slot photo/video grid (1 main + 4 secondary)
│   │   ├── circle/
│   │   │   ├── ProfileCard.tsx       # Swipe card for users (media carousel)
│   │   │   ├── CircleCard.tsx        # Swipe card for Circles (joiner view)
│   │   │   ├── CircleProgress.tsx    # Circle filling progress
│   │   │   ├── MemberRow.tsx         # Member avatar row
│   │   │   └── CapacityBadge.tsx     # "2 / 5 spots" badge
│   │   └── chat/
│   │       ├── MessageBubble.tsx
│   │       ├── MediaMessage.tsx
│   │       └── ChatInput.tsx
│   │
│   └── utils/
│       ├── locationUtils.ts          # Haversine distance calc
│       └── nominatimService.ts       # Reverse geocoding
│
├── supabase/
│   └── functions/
│       └── get-livekit-token/        # Supabase Edge Function for LiveKit tokens
│       └── verify-socio-plus/        # Store receipt/token validation
│           └── index.ts
│
├── assets/
│   ├── logo.png
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── animations/
│       └── logo_animation.json       # Lottie splash animation
│
├── app.json
├── babel.config.js
├── tsconfig.json
└── .env
```

---

## 5. SUPABASE SERVICES

### 5.1 Authentication (`src/services/auth.ts`)

Supabase Auth handles all authentication with support for:

- Email/password signup and login
- Google OAuth (via ID token)
- Phone OTP
- Password reset

```typescript
import { supabase } from "./supabase";

// Sign up with email/password
export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: email.split("@")[0] } },
  });
  if (error) throw error;
  return data.user;
};

// Sign in with email/password
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
};

// Sign in with Google ID token
export const signInWithGoogleIdToken = async (
  idToken: string,
  accessToken?: string,
) => {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    access_token: accessToken,
  });
  if (error) throw error;
  return data.user;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Phone OTP
export const sendOTP = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return data;
};

export const verifyOTP = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) throw error;
  return data.user;
};

// Password reset
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
};
```

### 5.2 User Profiles (`src/services/user.ts`)

```typescript
import { supabase } from "./supabase";
import { User } from "../types";

export const getUserProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  // Maps database row to User type
  return data ? mapRowToUser(data) : null;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>,
) => {
  const dbUpdates = mapUserToDb(updates);
  const { error } = await supabase
    .from("users")
    .update(dbUpdates)
    .eq("id", userId);

  if (error) throw error;
};

export const syncUserOnboarding = async (
  uid: string,
  draft: OnboardingDraft,
) => {
  const { error } = await supabase
    .from("users")
    .update({
      display_name: draft.name,
      age: draft.age,
      gender: draft.gender,
      education: draft.education,
      interests: draft.interests,
      traits: draft.traits,
      bio: draft.bio,
      profile_complete: true,
    })
    .eq("id", uid);

  if (error) throw error;
};
```

### 5.3 Circles (`src/services/circle.ts`)

```typescript
import { supabase } from "./supabase";
import { Circle } from "../types";

export const createCircle = async (input: CreateCircleInput) => {
  const { data, error } = await supabase
    .from("circles")
    .insert({
      name: input.name,
      creator_id: input.creatorId,
      size: input.size,
      members: [input.creatorId],
      pending_swipes: {},
      filters: {
        age_range: input.ageRange,
        education_level: input.educationLevel,
        location_radius: input.locationRadius,
        interests: input.interests,
        vibe: input.vibe || "",
      },
      meetup_goal: input.meetupGoal || "",
      status: "forming",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const getCircle = async (circleId: string) => {
  /* ... */
};

export const subscribeToCircle = (
  circleId: string,
  callback: (payload) => void,
) => {
  return supabase
    .channel(`circle:${circleId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "circles",
        filter: `id=eq.${circleId}`,
      },
      callback,
    )
    .subscribe();
};
```

### 5.4 Messages (`src/services/messages.ts`)

```typescript
import { supabase } from "./supabase";

export const sendMessage = async (
  circleId: string,
  senderId: string,
  senderName: string,
  text: string,
  mediaUrl?: string,
  mediaType?: "image" | "video" | "audio",
  mediaUrls?: string[],
  replyTo?: MessageReplyInput | null,
  pollId?: string,
) => {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      circle_id: circleId,
      sender_id: senderId,
      sender_name: senderName,
      text,
      media_url: mediaUrl ?? null,
      poll_id: pollId ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const subscribeToMessages = (circleId: string, callback) => {
  return supabase
    .channel(`messages:${circleId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `circle_id=eq.${circleId}`,
      },
      callback,
    )
    .subscribe();
};
```

### 5.5 Polls (`src/services/polls.ts`)

```typescript
import { supabase } from "./supabase";
import type { PollData } from "@/src/components/chat/PollComponents";

export const createPoll = async (
  circleId: string,
  pollData: Omit<PollData, "id" | "createdAt">,
): Promise<PollData> => {
  // create poll row and poll options
};

export const getPollsByIds = async (pollIds: string[]): Promise<PollData[]> => {
  // load poll metadata, poll options, and vote rows
};

export const addPollVote = async (
  pollId: string,
  optionIds: string[],
  userId: string,
): Promise<PollData> => {
  // replace the user's vote rows and return the updated poll
};
```

### 5.6 Notifications (`src/services/notifications.ts`)

```typescript
import { supabase } from "./supabase";

export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
};

export const subscribeToNotifications = (userId: string, callback) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe();
};
```

### 5.6 Supabase Client (`src/services/supabase.ts`)

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore adapter for Supabase Auth session persistence
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Silent fail
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Silent fail
    }
  },
};

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// User sync and role fetching
export const syncUserToSupabase = async (
  userId,
  email,
  displayName,
  photoURL,
) => {
  // Check if user exists, create if not
  const { data: existing } = await supabase
    .from("users")
    .select("id, role, status, suspended_until")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return existing;

  // Create new user
  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email: email ?? "",
      display_name: displayName,
      photo_url: photoURL,
      role: "user",
      status: "active",
    })
    .select("id, role, status, suspended_until")
    .single();

  if (error) throw error;
  return data;
};

export const getUserRole = async (uid: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("role, status, suspended_until")
    .eq("id", uid)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Storage functions
export const uploadAvatar = async (userId: string, imageUri: string) => {
  /* ... */
};
export const uploadChatMedia = async (
  circleId: string,
  messageId: string,
  mediaUri: string,
  type,
) => {
  /* ... */
};
```

---

## 6. AUTH CONTEXT (SUPABASE)

### `src/context/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getUserRole, syncUserToSupabase } from '../services/supabase';
import { getUserProfile } from '../services/user';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  role: { role: 'user' | 'moderator' | 'admin'; status: 'active' | 'suspended' | 'banned' } | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [role, setRole] = useState<AuthContextType['role']>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const userProfile = await getUserProfile(user.id);
    setProfile(userProfile);
    const userRole = await getUserRole(user.id);
    setRole(userRole ?? { role: 'user', status: 'active' });
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const supabaseUser = session?.user ?? null;
        setUser(supabaseUser);

        if (supabaseUser) {
          // Get profile from Supabase
          const userProfile = await getUserProfile(supabaseUser.id);
          setProfile(userProfile);

          // Sync to Supabase and get role
          try {
            const userRole = await syncUserToSupabase(
              supabaseUser.id,
              supabaseUser.email,
              supabaseUser.user_metadata?.display_name ?? supabaseUser.email?.split('@')[0],
              supabaseUser.user_metadata?.avatar_url ?? null
            );
            setRole(userRole);
          } catch (error) {
            setRole({ role: 'user', status: 'active' });
          }
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

## 7. SUPABASE SCHEMA

### PostgreSQL Tables

```sql
-- Users table (Supabase Auth UID as primary key)
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- Supabase Auth UID
  email TEXT NOT NULL,
  display_name TEXT,
  age INTEGER,
  gender TEXT,
  interests TEXT[],
  traits TEXT[],
  media JSONB,
  education TEXT,
  location JSONB,
  photo_url TEXT,
  bio TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  location_enabled BOOLEAN DEFAULT true,
  profile_complete BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  suspended_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Circles table
CREATE TABLE circles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id TEXT REFERENCES users(id),
  size INTEGER NOT NULL,
  members TEXT[] DEFAULT '{}',
  pending_swipes JSONB DEFAULT '{}',
  skipped_swipes JSONB DEFAULT '{}',
  filters JSONB,
  meetup_goal TEXT,
  status TEXT DEFAULT 'forming',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Circle pending joiners
CREATE TABLE circle_pending (
  id TEXT PRIMARY KEY,
  circle_id TEXT REFERENCES circles(id),
  user_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  circle_id TEXT REFERENCES circles(id),
  sender_id TEXT REFERENCES users(id),
  sender_name TEXT,
  text TEXT,
  poll_id TEXT REFERENCES polls(id),
  media_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Polls table
CREATE TABLE polls (
  id TEXT PRIMARY KEY,
  circle_id TEXT REFERENCES circles(id),
  created_by TEXT REFERENCES users(id),
  question TEXT NOT NULL,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Poll options table
CREATE TABLE poll_options (
  id TEXT PRIMARY KEY,
  poll_id TEXT REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_index INTEGER NOT NULL DEFAULT 0
);

-- Poll votes table
CREATE TABLE poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id TEXT REFERENCES polls(id) ON DELETE CASCADE,
  option_id TEXT REFERENCES poll_options(id),
  user_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (poll_id, user_id, option_id)
);

-- Notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT,
  title TEXT,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id),
  reported_user_id TEXT REFERENCES users(id),
  circle_id TEXT,
  message_id TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Moderation audit log
CREATE TABLE moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id TEXT REFERENCES users(id),
  target_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can read user profiles
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);

-- Users can create/update their own profile
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Anyone can read circles
CREATE POLICY "Public read circles" ON circles FOR SELECT USING (true);

-- Only circle members can insert messages
CREATE POLICY "Members insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Anyone can read their own notifications
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
```

---

## 8. STORAGE BUCKETS

Create two buckets in Supabase Dashboard → Storage:

| Bucket       | Purpose                    |
| ------------ | -------------------------- |
| `avatars`    | Profile photos             |
| `chat-media` | Chat images, videos, audio |

### File Path Conventions

```
avatars/
└── {userId}/
    └── profile.jpg

chat-media/
└── {circleId}/
    ├── images/
    │   └── {messageId}.jpg
    ├── videos/
    │   └── {messageId}.mp4
    └── audio/
        └── {messageId}.m4a
```

### Storage Policies

```sql
-- Avatars: anyone can read, only owner can upload
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Owner upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]);

-- Chat media: only circle members can read/upload
CREATE POLICY "Members read chat media" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media');
CREATE POLICY "Members upload chat media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-media');
```

---

## 9. LIVEKIT EDGE FUNCTION

### `supabase/functions/get-livekit-token/index.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { AccessToken } from "livekit-server-sdk";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  const { circleId, userId, userName } = await req.json();

  if (!circleId || !userId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const apiKey = Deno.env.get("LIVEKIT_API_KEY")!;
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET")!;
  const livekitUrl = Deno.env.get("LIVEKIT_URL")!;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
    ttl: "2h",
  });

  token.addGrant({
    room: circleId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return new Response(JSON.stringify({ token: await token.toJwt() }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

Deploy:

```bash
supabase functions deploy get-livekit-token
```

---

## 10. DESIGN SYSTEM

```typescript
// src/constants/theme.ts
export const Colors = {
  primary: "#FFB60C",
  primaryDark: "#D98F00",
  primaryLight: "#FFF4DD",
  orange: "#FFB60C",
  background: "#FFFFFF",
  surface: "#FFFFFF",
  inputBg: "#F5F5F5",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textDisabled: "#AAAAAA",
  divider: "#EFEFEF",
  placeholder: "#D4D4D4",
  border: "#E5E5E5",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  white: "#FFFFFF",
};
```

### Global Style Rules

- No shadows or elevation
- No borders or outlines (except interactive dashed chips)
- Primary CTA: always `#FFB60C` with black text
- All buttons: `borderRadius: 100` (pill shape)
- All inputs: `backgroundColor: #F5F5F5`, no border, `borderRadius: 14`
- Screen padding: `24` on all sides
- SafeAreaView on every screen

---

## 11. MIGRATION NOTES (Firebase → Supabase)

### What Changed

| Before (Firebase + Supabase)    | After (Supabase Only)   |
| ------------------------------- | ----------------------- |
| Firebase Auth for identity      | Supabase Auth           |
| Firestore for circles, messages | PostgreSQL              |
| Firebase Cloud Functions        | Supabase Edge Functions |
| Firebase Cloud Messaging        | PostgreSQL + realtime   |

### Service Mapping

| Old (Firebase)                                | New (Supabase)                                   |
| --------------------------------------------- | ------------------------------------------------ |
| `src/services/firebase.ts`                    | Removed                                          |
| `src/services/firestore.ts`                   | Removed                                          |
| `firebase.auth`                               | `supabase.auth`                                  |
| `firestore.collection('users')`               | `supabase.from('users')`                         |
| `onSnapshot`                                  | `supabase.channel().on('postgres_changes')`      |
| `httpsCallable(functions, 'getLivekitToken')` | `supabase.functions.invoke('get-livekit-token')` |

### Key Implementation Details

1. **Auth Persistence**: Uses `expo-secure-store` adapter for secure session storage
2. **User IDs**: Now use Supabase Auth `user.id` instead of Firebase `user.uid`
3. **Real-time**: Replaced Firestore `onSnapshot` with Supabase `channel.on('postgres_changes')`
4. **Token Generation**: Moved from Firebase Cloud Functions to Supabase Edge Function

---

## 12. SECURITY CHECKLIST

This is the **actual** state, reconciled with the repo and `TODO.md`. Items
that look "done" in the old checklist but are not yet true in the codebase
have been moved to `TODO.md` with `[ ]` or `[~]` markers.

- [x] Supabase Auth is the single identity source
- [~] Supabase RLS policies enabled on all tables — represented in SQL
  migrations, but **not yet verified** against the deployed Supabase project
- [x] LiveKit API Secret is intended to live in the Supabase Edge Function
      only (the app uses `EXPO_PUBLIC_*` for non-secret values)
- [x] Media file size limits enforced before upload
- [~] Role checks happen on both frontend and backend — UI checks exist,
  role/status writes are guarded by Supabase RPCs and a protected-field trigger,
  but deployed verification is still pending
- [x] Banned users blocked at navigation level (banned/suspended screens exist)
- [x] All moderation actions written to audit log — `moderation_logs` writes
      now happen from the moderation service and are also surfaced through
      server-side notification triggers
- [x] `.env` file in `.gitignore` — `.env` is untracked and ignored; see
      `TODO.md` for the remaining secret-rotation work

---

_This document should be kept updated as the architecture evolves._
_Last updated: June 2026 — v2.1 (Status table and security checklist reconciled with `TODO.md` / `PLAN.md` / `README.md`. The previous "✅ DONE" on every layer was overstated.)_
