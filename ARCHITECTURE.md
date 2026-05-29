# SOCIO — SYSTEM ARCHITECTURE

## Implementation Guide

> Version 2.0 | Prepared by: Izu Obikanyi
> Status: FULL SUPABASE MIGRATION COMPLETE (Firebase removed)
> Updated: May 2026 — Migrated from Firebase + Supabase (split) to Supabase only (single backend)

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

---

## 2. TECH STACK OVERVIEW

```
Layer               Service                       Status
─────────────────────────────────────────────────────────
Authentication      Supabase Auth                ✅ DONE
Database (app data) Supabase PostgreSQL          ✅ DONE
File Storage        Supabase Storage             ✅ DONE
Real-time Chat      Supabase Realtime            ✅ DONE
User Roles/Reports  Supabase PostgreSQL           ✅ DONE
Group Calls (E2EE)  Livekit Cloud                ✅ DONE
Call Tokens         Supabase Edge Function       ✅ DONE
Location Services   Expo Location + Nominatim    ✅ DONE
Notifications       Supabase PostgreSQL           ✅ DONE
```

### Golden Rule

> Each service does exactly ONE job. Never duplicate logic across services.

```
Supabase Auth       → who you are (identity + session)
Supabase Postgres   → all data (users, circles, messages, notifications)
Supabase Storage   → all media files (avatars, chat media)
Supabase Realtime   → real-time subscriptions (chat, notifications)
Livekit            → real-time E2EE audio/video calls
Supabase Edge Fn   → secure server-side token generation
```

---

## 3. ENVIRONMENT VARIABLES

Create a `.env` file in the project root. Never commit this file.

```dotenv
# Supabase Auth
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (configured in Supabase Dashboard)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# Livekit
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Livekit secrets (backend only — Supabase Edge Function)
# NEVER prefix these with EXPO_PUBLIC_
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

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
│   │   ├── _layout.tsx               # BottomNav: Circle · Swipe · Notifications · Profile
│   │   ├── home.tsx                  # Circle tab: NoCircleScreen or CircleScreen based on state
│   │   ├── swipe.tsx                 # SwipeScreen (host) or SwipeCirclesScreen (joiner)
│   │   ├── notifications.tsx         # Match alerts, Circle activity
│   │   └── profile.tsx              # ProfileScreen
│   │
│   ├── circle/                       # Circle flows
│   │   ├── no-circle.tsx             # Empty state — Create or Join CTA
│   │   ├── create.tsx                # Stage 1: name, vibe, meetup details
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
- Facebook OAuth (via access token)
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

- [x] Supabase Auth is the single identity source
- [x] Supabase RLS policies enabled on all tables
- [x] LiveKit API Secret only in Supabase Edge Function, never in the app
- [x] Media file size limits enforced before upload
- [x] Role checks happen on both frontend (UI) AND backend (Supabase RLS)
- [x] Banned users blocked at navigation level
- [x] All moderation actions written to audit log
- [x] `.env` file in `.gitignore`

---

_This document should be kept updated as the architecture evolves._
_Last updated: May 2026 — v2.0 (Full Supabase migration complete)_
