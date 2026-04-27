# SOCIO — SYSTEM ARCHITECTURE
## Copilot Implementation Guide
> Version 1.2 | Prepared by: Izu Obikanyi
> Status: Firebase Auth + Firestore = DONE. Everything below = TO BUILD.
> Updated: Supabase 2026 key naming + storage policy changes applied, plus UI architecture and flow summary.

---

## 1. WHAT IS SOCIO

Socio is a mobile-first React Native (Expo) app for forming private friend groups called **Circles**. Users are matched through interest-based filtering and mutual swiping. Once a Circle is full, members get access to group chat, media sharing, and E2EE group calls.

---

## 2. TECH STACK OVERVIEW

```
Layer               Service                       Status
─────────────────────────────────────────────────────────
Authentication      Firebase Auth                 ✅ DONE
Database (app data) Firebase Firestore            ✅ DONE
File Storage        Supabase Storage              🔲 TODO
User Roles/Reports  Supabase PostgreSQL           🔲 TODO
Real-time Chat      Firebase Firestore            ✅ DONE
Media Messages      Supabase Storage              🔲 TODO
Group Calls (E2EE)  Livekit Cloud                 🔲 TODO
Call Tokens         Firebase Cloud Functions      🔲 TODO
Location Services   Expo Location + Nominatim     🔲 TODO
Notifications       Firebase Cloud Messaging      🔲 TODO
```

### Golden Rule
> Each service does exactly ONE job. Never duplicate logic across services.

```
Firebase Auth      → who you are (identity only)
Firestore          → circles, chat messages, matching
Supabase Storage   → all media files (photos, video, audio)
Supabase Postgres  → user roles, reports, moderation
Livekit            → real-time E2EE audio/video calls
Firebase Functions → secure server-side token generation
```

---

## 3. ENVIRONMENT VARIABLES

Create a `.env` file in the project root. Never commit this file.

```dotenv
# Firebase (already configured)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Supabase
# URL: https://{project-ref}.supabase.co
# Find project-ref in browser URL: supabase.com/dashboard/project/{project-ref}
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
# 2026 NOTE: Supabase renamed keys. Use PUBLISHABLE key here (was called anon key)
# NEVER use the secret key (was called service_role) in the app
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key-here

# Livekit
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Livekit secrets (backend only — Firebase Cloud Functions)
# NEVER prefix these with EXPO_PUBLIC_
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Nominatim (no key needed — free, open source)
EXPO_PUBLIC_NOMINATIM_URL=https://nominatim.openstreetmap.org
```

---

## 4. FOLDER STRUCTURE

```
socio/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Splash screen
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── signup.tsx
│   │   ├── otp.tsx
│   │   ├── location-permission.tsx
│   │   ├── notifications-permission.tsx
│   │   ├── onboarding-intro.tsx
│   │   ├── profile-photo-name.tsx
│   │   ├── profile-age-gender.tsx
│   │   ├── profile-interests.tsx
│   │   ├── profile-traits.tsx
│   │   └── profile-complete.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── chats.tsx
│   │   └── profile.tsx
│   ├── circle/
│   │   ├── create.tsx
│   │   ├── swipe.tsx
│   │   ├── dashboard.tsx
│   │   ├── chat.tsx
│   │   └── call.tsx
│   ├── moderator/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   └── report-detail.tsx
│   └── admin/
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       └── user-management.tsx
│
├── src/
│   ├── services/
│   │   ├── firebase.ts           # Firebase init (DONE)
│   │   ├── firestore.ts          # Firestore helpers (DONE)
│   │   ├── supabase.ts           # Supabase client + storage + db
│   │   ├── moderation.ts         # All moderation actions
│   │   └── livekit.ts            # Call management
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # Firebase auth state
│   │   ├── useRole.ts            # Supabase role fetching
│   │   ├── useImageUpload.ts     # Profile photo upload
│   │   ├── useMediaUpload.ts     # Chat media (video/audio/image)
│   │   ├── useCircleCall.ts      # Livekit call management
│   │   └── useLocation.ts        # Expo Location + Nominatim
│   │
│   ├── context/
│   │   └── AuthContext.tsx       # Global auth + role state
│   │
│   ├── constants/
│   │   ├── colors.ts             # Design system colors
│   │   ├── typography.ts         # Font sizes and weights
│   │   └── theme.ts              # Full theme export
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Chip.tsx
│   │   │   └── Avatar.tsx
│   │   ├── circle/
│   │   │   ├── ProfileCard.tsx   # Swipe card
│   │   │   ├── CircleProgress.tsx
│   │   │   └── MemberRow.tsx
│   │   └── chat/
│   │       ├── MessageBubble.tsx
│   │       ├── MediaMessage.tsx
│   │       └── ChatInput.tsx
│   │
│   └── utils/
│       ├── locationUtils.ts      # Haversine distance calc
│       └── nominatimService.ts   # Reverse geocoding
│
├── functions/                    # Firebase Cloud Functions
│   ├── index.js                  # getLivekitToken function
│   └── package.json
│
├── assets/
│   ├── logo.png
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── animations/
│       └── logo_animation.json   # Lottie splash animation
│
├── app.json
├── babel.config.js
├── tsconfig.json
└── .env
```

---

## 5. UI ARCHITECTURE & FLOW SUMMARY

### Overview

Socio is a mobile-first social app for forming small in-person **Circles** (group meetups). Users either create a Circle and curate members, or join an existing Circle by being swiped on. The UI architecture below is the target screen and interaction blueprint we will tailor into the current Expo Router codebase as implementation continues.

### 5.1 Onboarding & Auth Flow

- `WelcomeScreen` — Logo + tagline, `Get started` CTA
- `OnboardingIntroScreen` — Value prop intro explaining how Circles work
- `OtpScreen` — Phone verification with OTP input
- `LocationPermissionScreen` — Grants location access for radius matching
- `NotificationsPermissionScreen` — Push notification opt-in

### 5.2 Profile Setup Flow

Tracked via `StepIndicator` with 4-step progress bars:

- `ProfilePhotoNameScreen` — Upload up to 5 photos / short videos (1 main + 4 secondary) + name
- `ProfileAgeGenderScreen` — Age stepper + gender selector (`male` / `female` / `both`)
- `ProfileInterestsScreen` — Multi-select interest chips
- `ProfileTraitsScreen` — Multi-select personality trait chips
- `ProfileCompleteScreen` — Success confirmation, then enters main app

### 5.3 Main App Shell

Persistent bottom navigation:

- `Home`
- `Swipe`
- `Notifications`
- `Profile`

Home branch:

- `NoCircleScreen` — Empty state with two paths:
  `Create a Circle` (primary CTA, Plus icon)
  `Join a Circle` (secondary CTA, Search icon)
- `HomeScreen` — Active Circle dashboard once joined or created

### 5.4 Create-a-Circle Flow (Host Path)

- `CreateCircleScreen` — Stage 1: Circle name, vibe, meetup details
- `CreateCirclePreferencesScreen` — Stage 2: who the host wants to attract
  age range (dual-thumb slider), gender mix, interests, personality traits
- `SwipeScreen` — Host swipes through users, with profile media carousel
- `CircleProgressScreen` — Progress state while members are being matched in
- `CircleCompleteScreen` — Circle is full and unlocks `ChatScreen`

### 5.5 Join-a-Circle Flow (Joiner Path)

- `JoinCirclePreferencesScreen` — Defines what the joiner is looking for:
  radius slider (1–50+ km), age range, gender mix, meetup vibe, interests, personality
- `SwipeCirclesScreen` — Joiner swipes through Circles rather than users:
  circle name, host, distance, capacity badge, overlapping member avatar stack, `JOIN` / `SKIP` overlays

Matching logic (conceptual):

- Joiner likes a Circle → host sees that user prioritized in their swipe deck
- Mutual like → joiner is added to the Circle → both land in `ChatScreen`

### 5.6 Edge & Empty States

- `SwipeEmptyScreen` — No more profiles or Circles to swipe
- `EdgeStatesScreen` — Generic error and empty-state UI patterns

### 5.7 Profile & Settings

- `ProfileScreen` — Avatar, name, stats, prominent `Edit profile` pill button with Pencil icon
- `EditProfileScreen` — Full editor mirroring onboarding fields:
  5-slot media grid (1 large main + 4 small), `MAIN` star badge, video Play icon, edit overlays,
  age stepper, gender tiles, bio textarea, interest chips, personality chips

Save affordances:

- Header `Save` action
- Bottom `Save` button

### 5.8 Communication

- `NotificationsScreen` — Match alerts and Circle activity
- `ChatScreen` — Group chat unlocked once a Circle is complete

### 5.9 Design System Notes

- All colors should resolve from semantic tokens, with the mobile design system mapped from the existing theme layer
- Rounded pill buttons use `borderRadius: 100`
- Standard card radius is `18px`
- Layouts follow an `8px` spacing grid
- If a gallery / showcase mode is used, a `Phone.tsx` wrapper can render screens inside a fixed mobile frame

### 5.10 Core User Journeys

Host journey:

- Onboard → Profile setup → No Circle → Create Circle → Set preferences → Swipe users → Circle fills → Chat

Joiner journey:

- Onboard → Profile setup → No Circle → Join Circle → Set preferences → Swipe Circles → Match with host → Added to Circle → Chat

---

## 6. SUPABASE SETUP

### 6.1 Storage Buckets

Create two buckets in Supabase Dashboard → Storage → New Bucket:

| Bucket | Public Toggle | Purpose |
|--------|--------------|---------|
| `avatars` | ❌ Leave OFF | Profile photos |
| `chat-media` | ❌ Leave OFF | Chat images, videos, audio |

> ⚠️ 2026 NOTE: Supabase now defaults buckets to private.
> Do NOT toggle public on. Access is controlled via SQL storage policies (section 6.6).
> Public URLs via getPublicUrl() still work as long as the SELECT policy is in place.

### 6.2 File Path Conventions

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

### 6.3 File Size Limits (enforce in code)

```
Profile photo:   5MB  max
Chat image:      5MB  max
Chat video:      50MB max  (15 seconds, compressed)
Audio message:   10MB max  (~15s audio ≈ 1MB, very safe)
```

### 6.4 PostgreSQL Schema

Run this SQL in Supabase → SQL Editor:

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE report_reason AS ENUM (
  'harassment',
  'spam',
  'inappropriate_content',
  'fake_profile',
  'underage',
  'other'
);

-- Users table (Firebase UID as primary key)
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- Firebase UID
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,                   -- Supabase Storage URL
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'active',
  suspended_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id),
  reported_user_id TEXT REFERENCES users(id),
  circle_id TEXT,                   -- Firestore circle ID (string ref)
  message_id TEXT,                  -- Firestore message ID (string ref)
  reason report_reason NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',    -- pending | reviewed | dismissed
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Moderation audit log
CREATE TABLE moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id TEXT REFERENCES users(id),
  target_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,             -- ban | suspend | warn | unban | promote | demote
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.5 Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can read basic user profiles
CREATE POLICY "Public read users"
ON users FOR SELECT USING (true);

-- Users can create reports
CREATE POLICY "Users can report"
ON reports FOR INSERT WITH CHECK (true);

-- Only moderators and admins can read reports
CREATE POLICY "Mods read reports"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('moderator', 'admin')
  )
);

-- Only admins can read audit logs
CREATE POLICY "Admin reads logs"
ON moderation_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Only admins can update roles
CREATE POLICY "Admin updates roles"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### 6.6 Storage Policies (2026 — Run in SQL Editor)

> ⚠️ Because buckets are private by default, you MUST run these policies
> or file uploads and reads will fail silently.

```sql
-- AVATARS BUCKET POLICIES

-- Anyone can view avatars (needed for profile photos to display)
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars
CREATE POLICY "Authenticated upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Users can only update their own avatar folder
CREATE POLICY "Update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- CHAT-MEDIA BUCKET POLICIES

-- Anyone can read chat media (needed for images/video/audio to display)
CREATE POLICY "Public read chat media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'chat-media');

-- Authenticated users can upload chat media
CREATE POLICY "Authenticated upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');
```

---

## 7. SUPABASE SERVICE IMPLEMENTATION

### `src/services/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
// 2026: EXPO_PUBLIC_SUPABASE_ANON_KEY holds the PUBLISHABLE key (formerly anon key)
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── USER SYNC ──────────────────────────────────────────────────────────

// Call this once immediately after Firebase login
export const syncUserToSupabase = async (firebaseUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) => {
  const { uid, email, displayName, photoURL } = firebaseUser;

  const { data: existing } = await supabase
    .from('users')
    .select('id, role, status, suspended_until')
    .eq('id', uid)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: uid,
      email,
      display_name: displayName,
      photo_url: photoURL,
      role: 'user',
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch role on every app load
export const getUserRole = async (uid: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('role, status, suspended_until')
    .eq('id', uid)
    .single();

  if (error) throw error;
  return data;
};

// ── AVATAR UPLOAD ──────────────────────────────────────────────────────

export const uploadAvatar = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  if (blob.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5MB');
  }

  const filePath = `avatars/${userId}/profile.jpg`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// ── CHAT MEDIA UPLOAD ──────────────────────────────────────────────────

type MediaType = 'image' | 'video' | 'audio';

const MAX_SIZES: Record<MediaType, number> = {
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
};

const EXTENSIONS: Record<MediaType, string> = {
  image: 'jpg',
  video: 'mp4',
  audio: 'm4a',
};

const CONTENT_TYPES: Record<MediaType, string> = {
  image: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/m4a',
};

export const uploadChatMedia = async (
  circleId: string,
  messageId: string,
  mediaUri: string,
  type: MediaType
): Promise<string> => {
  const response = await fetch(mediaUri);
  const blob = await response.blob();

  if (blob.size > MAX_SIZES[type]) {
    throw new Error(`${type} file is too large`);
  }

  const ext = EXTENSIONS[type];
  const filePath = `chat-media/${circleId}/${type}s/${messageId}.${ext}`;

  const { error } = await supabase.storage
    .from('chat-media')
    .upload(filePath, blob, {
      contentType: CONTENT_TYPES[type],
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('chat-media')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
```

---

## 8. AUTH CONTEXT WITH ROLES

### `src/context/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { syncUserToSupabase, getUserRole } from '../services/supabase';

type Role = 'user' | 'moderator' | 'admin' | null;
type Status = 'active' | 'suspended' | 'banned' | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  status: Status;
  loading: boolean;
  isUser: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isSuspended: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await syncUserToSupabase(firebaseUser);
          const data = await getUserRole(firebaseUser.uid);
          setUser(firebaseUser);
          setRole(data.role);
          setStatus(data.status);
        } catch (error) {
          console.error('Auth sync error:', error);
        }
      } else {
        setUser(null);
        setRole(null);
        setStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      role,
      status,
      loading,
      isUser: role === 'user',
      isModerator: role === 'moderator',
      isAdmin: role === 'admin',
      isBanned: status === 'banned',
      isSuspended: status === 'suspended',
    }}>
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

## 9. ROLE-BASED NAVIGATION

### `app/_layout.tsx`

```typescript
import { useAuth } from '../src/context/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function RootLayout() {
  const { user, role, status, loading } = useAuth();

  if (loading) return null; // show splash

  // Banned wall
  if (status === 'banned') return <Redirect href="/banned" />;

  // Not logged in
  if (!user) return <Redirect href="/(auth)/signup" />;

  // Role-based redirect
  if (role === 'admin') return <Redirect href="/admin/dashboard" />;
  if (role === 'moderator') return <Redirect href="/moderator/dashboard" />;

  // Regular user
  return <Redirect href="/(tabs)/home" />;
}
```

---

## 10. MODERATION SERVICE

### `src/services/moderation.ts`

```typescript
import { supabase } from './supabase';

// ── REPORTS ────────────────────────────────────────────────────────────

export const reportUser = async (payload: {
  reporterId: string;
  reportedUserId: string;
  circleId?: string;
  messageId?: string;
  reason: string;
  details?: string;
}) => {
  const { error } = await supabase.from('reports').insert({
    reporter_id: payload.reporterId,
    reported_user_id: payload.reportedUserId,
    circle_id: payload.circleId,
    message_id: payload.messageId,
    reason: payload.reason,
    details: payload.details,
  });
  if (error) throw error;
};

export const getPendingReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(id, display_name, photo_url),
      reported:reported_user_id(id, display_name, photo_url, status)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const resolveReport = async (
  reportId: string,
  moderatorId: string,
  resolution: 'reviewed' | 'dismissed'
) => {
  const { error } = await supabase
    .from('reports')
    .update({
      status: resolution,
      reviewed_by: moderatorId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) throw error;
};

// ── MODERATION ACTIONS ─────────────────────────────────────────────────

export const banUser = async (
  moderatorId: string,
  targetUserId: string,
  reason: string
) => {
  const { error } = await supabase
    .from('users')
    .update({ status: 'banned' })
    .eq('id', targetUserId);

  if (error) throw error;
  await logAction(moderatorId, targetUserId, 'ban', reason);
};

export const suspendUser = async (
  moderatorId: string,
  targetUserId: string,
  reason: string,
  days: number = 7
) => {
  const suspendedUntil = new Date();
  suspendedUntil.setDate(suspendedUntil.getDate() + days);

  const { error } = await supabase
    .from('users')
    .update({
      status: 'suspended',
      suspended_until: suspendedUntil.toISOString(),
    })
    .eq('id', targetUserId);

  if (error) throw error;
  await logAction(moderatorId, targetUserId, 'suspend', reason, { days });
};

export const unbanUser = async (
  moderatorId: string,
  targetUserId: string
) => {
  const { error } = await supabase
    .from('users')
    .update({ status: 'active', suspended_until: null })
    .eq('id', targetUserId);

  if (error) throw error;
  await logAction(moderatorId, targetUserId, 'unban');
};

// ── ADMIN ONLY ─────────────────────────────────────────────────────────

export const promoteUser = async (
  adminId: string,
  targetUserId: string,
  newRole: 'moderator' | 'admin'
) => {
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', targetUserId);

  if (error) throw error;
  await logAction(adminId, targetUserId, 'promote', null, { new_role: newRole });
};

export const demoteUser = async (
  adminId: string,
  targetUserId: string
) => {
  const { error } = await supabase
    .from('users')
    .update({ role: 'user' })
    .eq('id', targetUserId);

  if (error) throw error;
  await logAction(adminId, targetUserId, 'demote');
};

// ── AUDIT LOG ──────────────────────────────────────────────────────────

const logAction = async (
  moderatorId: string,
  targetUserId: string,
  action: string,
  reason: string | null = null,
  metadata: object = {}
) => {
  await supabase.from('moderation_logs').insert({
    moderator_id: moderatorId,
    target_user_id: targetUserId,
    action,
    reason,
    metadata,
  });
};
```

---

## 11. LOCATION SERVICES

### Stack: Expo Location + Nominatim (OpenStreetMap)
### No API key required. Completely free.

### `src/services/nominatimService.ts`

```typescript
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string> => {
  const url = `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json`;

  const response = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
  });

  const data = await response.json();
  return data.address?.city
    || data.address?.town
    || data.address?.village
    || 'Unknown location';
};
```

### `src/hooks/useLocation.ts`

```typescript
import { useState } from 'react';
import * as ExpoLocation from 'expo-location';
import { reverseGeocode } from '../services/nominatimService';

export const useLocation = () => {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    city: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    try {
      const { status } = await ExpoLocation
        .requestForegroundPermissionsAsync();

      if (status !== 'granted') return null;

      const loc = await ExpoLocation.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lng } = loc.coords;
      const city = await reverseGeocode(lat, lng);

      setLocation({ lat, lng, city });
      return { lat, lng, city };
    } finally {
      setLoading(false);
    }
  };

  // Haversine formula — distance between two coordinates in km
  const getDistance = (
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  return { location, loading, requestLocation, getDistance };
};
```

---

## 12. LIVEKIT E2EE CALLS

### How E2EE Works in LiveKit
> There is NO dashboard toggle. E2EE is configured entirely in code.
> LiveKit never holds your encryption keys — your app does.
> Media is E2EE. Signaling is TLS only.

### Flow

```
User taps "Start Call"
       ↓
App calls Firebase Cloud Function → getLivekitToken
       ↓
Cloud Function returns a signed JWT token
       ↓
App fetches Circle's shared callKey from Firestore
       ↓
App connects to Livekit room with token + callKey
       ↓
All Circle members join with same callKey
       ↓
Livekit encrypts media — never sees the key
```

### Firestore: Store Call Key Per Circle

```
circles/{circleId}/
  callKey: "base64-encoded-aes-key"   ← generated once, stored here
```

Only Circle members can read this document (enforced by Firestore rules).

### `src/services/livekit.ts`

```typescript
import {
  Room,
  RoomEvent,
  ExternalE2EEKeyProvider,
} from '@livekit/react-native';

export const joinCircleCall = async (
  livekitUrl: string,
  token: string,
  sharedKey: string
): Promise<Room> => {
  const keyProvider = new ExternalE2EEKeyProvider();
  await keyProvider.setKey(sharedKey);

  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    e2ee: {
      keyProvider,
    },
  });

  await room.connect(livekitUrl, token, {
    autoSubscribe: true,
  });

  await room.localParticipant.enableCameraAndMicrophone();
  return room;
};

export const leaveCall = async (room: Room) => {
  await room.disconnect();
};
```

### `src/hooks/useCircleCall.ts`

```typescript
import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, app } from '../services/firebase';
import { joinCircleCall, leaveCall } from '../services/livekit';

const functions = getFunctions(app);
const getToken = httpsCallable(functions, 'getLivekitToken');

const generateSharedKey = async (): Promise<string> => {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 128 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

const getCircleCallKey = async (circleId: string): Promise<string> => {
  const ref = doc(db, 'circles', circleId);
  const snap = await getDoc(ref);
  const data = snap.data();

  if (data?.callKey) return data.callKey;

  const newKey = await generateSharedKey();
  await setDoc(ref, { callKey: newKey }, { merge: true });
  return newKey;
};

export const useCircleCall = (circleId: string, userName: string) => {
  const [room, setRoom] = useState<any>(null);
  const [inCall, setInCall] = useState(false);
  const [loading, setLoading] = useState(false);

  const startCall = async () => {
    try {
      setLoading(true);
      const result: any = await getToken({ circleId, userName });
      const { token } = result.data;
      const sharedKey = await getCircleCallKey(circleId);
      const livekitUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL!;
      const activeRoom = await joinCircleCall(livekitUrl, token, sharedKey);
      setRoom(activeRoom);
      setInCall(true);
    } catch (error) {
      console.error('Call failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const endCall = async () => {
    if (room) {
      await leaveCall(room);
      setRoom(null);
      setInCall(false);
    }
  };

  return { startCall, endCall, inCall, loading, room };
};
```

---

## 13. FIREBASE CLOUD FUNCTIONS

### Purpose: Generate LiveKit tokens securely server-side.
### The LiveKit API Secret must NEVER be in the mobile app.

### `functions/index.js`

```javascript
const functions = require('firebase-functions');
const { AccessToken } = require('livekit-server-sdk');

exports.getLivekitToken = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in'
      );
    }

    const { circleId, userName } = data;
    const userId = context.auth.uid;

    const apiKey = functions.config().livekit.api_key;
    const apiSecret = functions.config().livekit.api_secret;

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName,
      ttl: '2h',
    });

    token.addGrant({
      room: circleId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return { token: await token.toJwt() };
  }
);
```

### Deploy Commands

```bash
# Set secrets (run once)
firebase functions:config:set \
  livekit.api_key="YOUR_API_KEY" \
  livekit.api_secret="YOUR_API_SECRET"

# Deploy
firebase deploy --only functions
```

---

## 14. FIRESTORE DATA MODELS

These are already set up but documented here for reference.

```
users/{userId}
  name: string
  age: number
  gender: string
  interests: string[]
  traits: string[]
  education: string
  location: { lat: number, lng: number }
  city: string
  photoURL: string              ← Supabase Storage URL
  bio: string
  createdAt: timestamp

circles/{circleId}
  name: string
  creatorId: string
  size: number                  ← target member count (3-8)
  members: string[]             ← array of userIds
  pendingSwipes: {              ← userId → [approvedUserIds]
    [userId]: string[]
  }
  callKey: string               ← E2EE key for Livekit calls
  filters: {
    ageRange: [number, number]
    educationLevel: string
    locationRadius: number
    interests: string[]
    vibe: string
    meetupGoal: string
  }
  status: 'forming' | 'complete'
  createdAt: timestamp

circles/{circleId}/messages/{messageId}
  senderId: string
  senderName: string
  type: 'text' | 'image' | 'video' | 'audio'
  text: string
  mediaUrl: string              ← Supabase Storage URL (if media)
  mediaSize: number             ← bytes
  mediaDuration: number         ← seconds (video/audio only)
  timestamp: timestamp
```

---

## 15. DESIGN SYSTEM

```typescript
// src/constants/colors.ts
export const Colors = {
  primary: '#F5C518',
  primaryDark: '#E0A800',
  primaryLight: '#FFF3C4',
  orange: '#F08C00',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  inputBg: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textDisabled: '#AAAAAA',
  divider: '#EFEFEF',
  placeholder: '#D4D4D4',
  success: '#34C759',
  danger: '#FF3B30',
  white: '#FFFFFF',
};
```

### Global Style Rules (apply to every screen)
- ❌ No shadows or elevation
- ❌ No borders or outlines (except interactive dashed chips)
- ❌ No heavy gradients
- ✅ Primary CTA: always `#F5C518` with black text
- ✅ All buttons: `borderRadius: 100` (pill shape)
- ✅ All inputs: `backgroundColor: #F5F5F5`, no border, `borderRadius: 14`
- ✅ Screen padding: `24` on all sides
- ✅ SafeAreaView on every screen

---

## 16. ONBOARDING FLOW (COMPLETE)

```
SplashScreen              → Lottie animation (logo_animation.json)
SignUpScreen              → Firebase Auth (Google + Email)
OTPScreen                 → Firebase OTP verification
LocationPermissionScreen  → Expo Location permission request
NotificationsPermission   → Expo Notifications permission request
OnboardingIntroScreen     → "Let's build your vibe" story screen
ProfilePhotoName          → Step 1/4 (photo + name)
ProfileAgeGender          → Step 2/4 (age picker + gender tiles)
ProfileInterests          → Step 3/4 (interest chips, min 3)
ProfileTraits             → Step 4/4 (optional trait chips)
ProfileCompleteScreen     → Celebration → navigate to HomeScreen
```

---

## 17. ROLE SYSTEM

### Roles

| Role | Access |
|------|--------|
| `user` | Normal app (circles, chat, calls) |
| `moderator` | Moderator dashboard (review reports, ban/suspend) |
| `admin` | Admin dashboard (all moderator powers + promote/demote users) |

### How Roles Are Assigned
- All new users get `role: 'user'` automatically on first login
- Only an admin can promote a user to moderator or admin
- Role is stored in **Supabase Postgres** `users` table
- Role is fetched from Supabase immediately after Firebase login
- Role is stored in `AuthContext` and used for navigation routing

### First Admin Setup
Run this SQL once in Supabase SQL Editor:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```
After that, all role management is done through the Admin Dashboard UI.

### User Status

| Status | Meaning |
|--------|---------|
| `active` | Normal access |
| `suspended` | Temporary block (has `suspended_until` date) |
| `banned` | Permanent block (sees BannedScreen) |

---

## 18. MEDIA ARCHITECTURE SUMMARY

```
User action              Storage location
────────────────────────────────────────────────────────
Profile photo upload  →  Supabase: avatars/{userId}/profile.jpg
Chat image send       →  Supabase: chat-media/{circleId}/images/{msgId}.jpg
Chat video send       →  Supabase: chat-media/{circleId}/videos/{msgId}.mp4
Chat audio send       →  Supabase: chat-media/{circleId}/audio/{msgId}.m4a
Media URL reference   →  Stored as string in Firestore message document
Group call session    →  Livekit Cloud (no files stored)
Call E2EE key         →  Firestore: circles/{circleId}/callKey
```

---

## 19. PACKAGES TO INSTALL

Run these commands to install all required packages:

```bash
# Supabase
npx expo install @supabase/supabase-js

# Media picking
npx expo install expo-image-picker
npx expo install expo-document-picker

# Location
npx expo install expo-location

# Notifications
npx expo install expo-notifications

# Livekit
npx expo install @livekit/react-native
npx expo install @livekit/react-native-webrtc

# Lottie (splash animation)
npx expo install lottie-react-native

# Fix any version mismatches
npx expo install --fix
```

---

## 20. IMPLEMENTATION ORDER

Build in this exact order to avoid dependency issues:

```
Phase 1 — Foundation (already done)
  ✅ Firebase Auth
  ✅ Firestore data models
  ✅ Basic navigation

Phase 2 — Supabase
  1. Create Supabase project
  2. Create storage buckets (avatars, chat-media)
  3. Run PostgreSQL schema SQL
  4. Add RLS policies
  5. Implement supabase.ts service
  6. Update AuthContext to sync roles

Phase 3 — Onboarding UI
  7. SplashScreen (Lottie)
  8. SignUpScreen
  9. OTPScreen
  10. LocationPermissionScreen
  11. NotificationsPermissionScreen
  12. OnboardingIntroScreen
  13. Profile setup screens (4 steps)
  14. ProfileCompleteScreen

Phase 4 — Core App
  15. HomeScreen
  16. CreateCircleScreen
  17. SwipeScreen
  18. CircleDashboardScreen

Phase 5 — Chat + Media
  19. CircleChatScreen (text)
  20. useMediaUpload hook
  21. Media message sending (image/video/audio)
  22. MediaMessage component

Phase 6 — Calls
  23. Firebase Cloud Functions setup
  24. Livekit integration
  25. useCircleCall hook
  26. CallScreen UI

Phase 7 — Moderation
  27. moderation.ts service
  28. ModeratorDashboard screen
  29. ReportDetailScreen
  30. AdminDashboard screen
  31. UserManagementScreen
```

---

## 21. SECURITY CHECKLIST

- [ ] Firebase UID is the single identity source across all services
- [ ] Supabase RLS policies are enabled on all tables
- [ ] LiveKit API Secret is only in Firebase Cloud Functions, never in the app
- [ ] E2EE call keys are stored in Firestore, only readable by Circle members
- [ ] Media file size limits are enforced before upload
- [ ] Role checks happen on both frontend (UI) AND backend (Supabase RLS)
- [ ] Banned users are blocked at navigation level before any screen loads
- [ ] All moderation actions are written to the audit log
- [ ] `.env` file is in `.gitignore`

---

*This document should be kept updated as the architecture evolves.*
*Last updated: April 2026 — v1.1 (Supabase 2026 key naming + storage policy changes)*
