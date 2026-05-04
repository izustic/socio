# SOCIO — SYSTEM ARCHITECTURE
## Copilot Implementation Guide
> Version 1.3 | Prepared by: Izu Obikanyi
> Status: Firebase Auth + Firestore = DONE. Everything below = TO BUILD.
> Updated: Full UI architecture, dual user journeys (Host + Joiner), updated screen list.
> v1.3: Auth flow corrected — WelcomeScreen (01), EmailSignUpScreen (02), LoginScreen (03).

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
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

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
├── app/                              # Expo Router screens (file-based routing)
│   ├── _layout.tsx                   # Root layout
│   ├── index.tsx                     # Splash screen (Lottie animation)
│   │
│   ├── (auth)/                       # Onboarding & auth flow
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx               # 01 — Logo + tagline + social CTAs + "Log in" link
│   │   ├── email-signup.tsx          # 02 — Email + password sheet (overlays welcome)
│   │   ├── login.tsx                 # 03 — Returning user: email/password + social fallback
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
│   │   ├── _layout.tsx               # BottomNav: Home · Swipe · Notifications · Profile
│   │   ├── home.tsx                  # NoCircleScreen or HomeScreen based on state
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
│   │   ├── firebase.ts               # Firebase init (DONE)
│   │   ├── firestore.ts              # Firestore helpers (DONE)
│   │   ├── supabase.ts               # Supabase client + storage + db
│   │   ├── moderation.ts             # All moderation actions
│   │   └── livekit.ts                # Call management
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                # Firebase auth state
│   │   ├── useRole.ts                # Supabase role fetching
│   │   ├── useImageUpload.ts         # Profile photo/video upload (up to 5 slots)
│   │   ├── useMediaUpload.ts         # Chat media (video/audio/image)
│   │   ├── useCircleCall.ts          # Livekit call management
│   │   └── useLocation.ts            # Expo Location + Nominatim
│   │
│   ├── context/
│   │   └── AuthContext.tsx           # Global auth + role state
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
├── functions/                        # Firebase Cloud Functions
│   ├── index.js                      # getLivekitToken function
│   └── package.json
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

## 5. UI ARCHITECTURE & FLOW SUMMARY

### Overview

Socio is a mobile-first social app for forming small in-person **Circles** (group meetups). Users either create a Circle and curate members (Host path), or join an existing Circle by being swiped on (Joiner path). The UI architecture below is the target screen and interaction blueprint tailored into the Expo Router codebase.

### 5.1 Onboarding & Auth Flow

Three-screen auth sequence:

- `WelcomeScreen` (01) — Logo + tagline, social login CTAs (Google, Facebook), "Sign up with Email" link, "Already have an account? Log in" footer
- `EmailSignUpScreen` (02) — Bottom sheet over dimmed yellow backdrop: email + password fields, "Create account" CTA, link back to Log in
- `LoginScreen` (03) — Full screen for returning users: email + password, "Forgot?" link, "Log in" CTA, social login fallback (Google, Facebook), "New to Socio? Sign up" footer

Post-auth permissions:

- `OTPScreen` — Phone or email OTP verification
- `LocationPermissionScreen` — Grants location access for radius matching
- `NotificationsPermissionScreen` — Push notification opt-in

Auth routing logic:

- No Firebase user → `WelcomeScreen`
- Firebase user but no Firestore profile → resume at `ProfilePhotoNameScreen`
- Firebase user + complete profile → `HomeScreen`

### 5.2 Profile Setup Flow

Tracked via `StepIndicator` with 4-step progress bars:

- `OnboardingIntroScreen` — Value prop intro: "Let's build your vibe." Explains what's coming before setup begins
- `ProfilePhotoNameScreen` — Step 1/4: Upload up to 5 photos / short videos (1 main large slot + 4 secondary slots). MAIN slot has a star badge. Video slots show a Play icon overlay. Includes name input (underline style)
- `ProfileAgeGenderScreen` — Step 2/4: Age stepper + gender selector tiles (`Male` / `Female` / `Both`)
- `ProfileInterestsScreen` — Step 3/4: Multi-select interest chips, minimum 3 required
- `ProfileTraitsScreen` — Step 4/4: Multi-select personality trait chips, optional
- `ProfileCompleteScreen` — Full yellow celebration screen, shows selected interests, "Find My Circle" CTA → navigates to `NoCircleScreen`

### 5.3 Main App Shell

Persistent bottom navigation with 4 tabs:

- `Home`
- `Swipe`
- `Notifications`
- `Profile`

Home branch:

- `NoCircleScreen` — Empty state with two paths:
  `Create a Circle` (primary CTA, Plus icon) → Host flow
  `Join a Circle` (secondary CTA, Search icon) → Joiner flow
- `HomeScreen` — Active Circle dashboard once a Circle is forming or complete

### 5.4 Create-a-Circle Flow (Host Path)

- `CreateCircleScreen` — Stage 1: Circle name, vibe description, meetup goal (chips: Coffee, Study, Gym, Food etc.), meetup timeframe (chips: This week, Within 3 days etc.), circle size stepper (3–8)
- `CreateCirclePreferencesScreen` — Stage 2: who the host wants to attract
  age range (dual-thumb slider), gender mix tiles, location radius slider with km/miles toggle, shared interests chips, personality trait chips
- `SwipeScreen` — Host swipes through users. Profile cards show media carousel, name + age, bio, shared interest chips, distance. JOIN ✓ / SKIP ✕ overlays animate on drag. Prioritizes users who already liked the Circle
- `CircleProgressScreen` — Fills as members are matched in. Shows avatar slots (filled + empty placeholders), progress bar, member count, "Continue Swiping" CTA
- `CircleCompleteScreen` — Circle is full. Shows all members, meetup goal pill, countdown timer ("Meet in X days"), "Enter Circle" CTA → unlocks `ChatScreen`

### 5.5 Join-a-Circle Flow (Joiner Path)

- `JoinCirclePreferencesScreen` — Defines what the joiner is looking for:
  location radius slider (1–50+ km) with km/miles toggle, age range (dual-thumb slider), gender mix tiles, meetup vibe chips, interests chips, personality trait chips (optional)
- `SwipeCirclesScreen` — Joiner swipes through Circles rather than users. Circle cards show: circle name, host info, distance, `CapacityBadge` ("2 / 5 spots"), `AvatarStack` of existing members with +N overflow, meetup goal pill, shared interest chips. JOIN ✓ / SKIP ✕ overlays

Matching logic:

- Joiner likes a Circle → host sees that user prioritized in their swipe deck
- Host likes the joiner back → mutual match → joiner added to Circle
- Both land in `ChatScreen` once Circle is complete

### 5.6 Edge & Empty States

- `SwipeEmptyScreen` — No more profiles or Circles to swipe. Suggests adjusting filters or checking back later
- Generic error and loading states handled inline per screen

### 5.7 Profile & Settings

- `ProfileScreen` — Avatar (from mediaUrls[0]), name, city, stats row (Circles formed, Members met), interests chips (read-only), traits chips, settings list (Notifications, Privacy, Help), Log out + Delete account links
- `EditProfileScreen` — Full editor mirroring onboarding fields:
  5-slot `MediaGrid` (1 large main + 4 small), MAIN star badge, video Play icon overlay, edit overlay on each filled slot,
  name input, age stepper, gender tiles, bio textarea, interests chip grid, personality chip grid

Save affordances:

- Header `Save` text button (top right)
- Bottom sticky `Save` button

### 5.8 Communication

- `NotificationsScreen` — Match alerts, Circle activity, reminders (e.g. "Your Circle is still forming")
- `ChatScreen` — Group chat unlocked once Circle is complete. Supports text, images, short videos (15s max), audio messages. Creator can remove members or mute notifications
- `CallScreen` — E2EE group voice/video call per Circle using LiveKit. "E2EE Encrypted" badge shown. Controls: mic toggle, camera toggle, end call

### 5.9 Moderation

- `ModeratorDashboard` — Pending reports queue, resolved/dismissed tabs, report cards with reason chip and "Review" CTA
- `ReportDetailScreen` — Reported user profile, report details, action buttons: Dismiss, Warn, Suspend 7 Days, Permanent Ban (with confirmation modal)
- `AdminDashboard` — Stats cards (Total Users, Active Circles, Pending Reports, Banned Users), recent moderation log
- `UserManagementScreen` — User list with search, role badges, status badges, role promotion/demotion actions

### 5.10 Design System Notes

- All colors resolve from semantic HSL tokens (`--primary`, `--primary-soft`, `--muted-foreground` etc.)
- Primary accent: `#F5C518` warm yellow — used for all primary CTAs, active states, selected chips
- Rounded pill buttons: `borderRadius: 100`
- Card radius: `18px`
- Spacing grid: `8px` base unit
- Screen padding: `24px` horizontal on all screens
- No shadows, no borders, no gradients (except one subtle photo overlay in swipe cards)
- SafeAreaView on every screen

### 5.11 Core User Journeys

Host journey:
Onboard → Profile setup → No Circle → Create Circle → Set preferences
→ Swipe users → Circle fills → CircleComplete → Chat / Call

Joiner journey:
Onboard → Profile setup → No Circle → Join Circle → Set preferences
→ Swipe Circles → Mutual match with host → Added to Circle → Chat / Call

---

## 5. SUPABASE SETUP

### 5.1 Storage Buckets

Create two buckets in Supabase Dashboard → Storage:

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | ✅ Yes | Profile photos |
| `chat-media` | ✅ Yes | Chat images, videos, audio |

> ⚠️ 2026 NOTE: Supabase now defaults buckets to private.
> Do NOT toggle public on. Access is controlled via SQL storage policies (section 6.6).
> Public URLs via getPublicUrl() still work as long as the SELECT policy is in place.

### 5.2 File Path Conventions

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

### 5.3 File Size Limits (enforce in code)

```
Profile photo:   5MB  max
Chat image:      5MB  max
Chat video:      50MB max  (15 seconds, compressed)
Audio message:   10MB max  (~15s audio ≈ 1MB, very safe)
```

### 5.4 PostgreSQL Schema

Run this SQL in Supabase → SQL Editor: (ASSUME I'VE ALREADY DONE THIS ON SUPABASE)

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

### 5.5 Row Level Security Policies (ASSUME I'VE RUN THIS ON SUPABASE)

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

---

## 6. SUPABASE SERVICE IMPLEMENTATION

### `src/services/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
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

## 7. AUTH CONTEXT WITH ROLES

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

## 8. ROLE-BASED NAVIGATION

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

## 9. MODERATION SERVICE

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

## 10. LOCATION SERVICES

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

## 11. LIVEKIT E2EE CALLS

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

## 12. FIREBASE CLOUD FUNCTIONS

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

## 13. FIRESTORE DATA MODELS

These are already set up but documented here for reference.

```
users/{userId}
  name: string
  age: number
  gender: 'male' | 'female' | 'both'
  interests: string[]
  traits: string[]
  education: string
  location: { lat: number, lng: number }
  city: string
  mediaUrls: string[]           ← array of up to 5 Supabase URLs
                                   index 0 = main photo/video
                                   index 1–4 = secondary slots
  bio: string
  activeCircleId: string | null ← null if no active Circle
  circleRole: 'host' | 'joiner' | null
  createdAt: timestamp

circles/{circleId}
  name: string
  vibe: string                  ← circle description
  meetupGoal: string            ← Coffee | Study | Gym | Food etc.
  meetupTimeframe: string       ← "This week" | "Within 3 days" etc.
  creatorId: string             ← host userId
  size: number                  ← target member count (3-8)
  members: string[]             ← array of confirmed userIds
  pendingJoiners: string[]      ← joiners who liked this Circle
                                   (prioritized in host swipe deck)
  callKey: string               ← E2EE key for Livekit calls
  filters: {
    ageRange: [number, number]  ← dual-thumb slider values
    genderMix: 'male' | 'female' | 'both'
    locationRadius: number      ← km
    interests: string[]
    traits: string[]
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

## 14. DESIGN SYSTEM

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

## 15. ONBOARDING FLOW (COMPLETE)

```
SplashScreen                  → Lottie animation (logo_animation.json)

── AUTH (3 screens) ──────────────────────────────────────────────
01 WelcomeScreen              → Logo + tagline + social CTAs
                                "Sign up with Email" → EmailSignUpScreen (sheet)
                                "Already have an account? Log in" → LoginScreen

02 EmailSignUpScreen          → Bottom sheet over dimmed yellow welcome backdrop
                                Email + password fields
                                "Create account" CTA → OTPScreen
                                "Already have an account? Log in" → LoginScreen

03 LoginScreen                → Full screen for returning users
                                Email + password + "Forgot?" link
                                "Log in" CTA → HomeScreen (if profile exists)
                                "or continue with" Google / Facebook
                                "New to Socio? Sign up" → WelcomeScreen

── POST-AUTH PERMISSIONS ─────────────────────────────────────────
OTPScreen                     → Phone/email OTP verification → LocationPermission
LocationPermissionScreen      → Expo Location permission request
NotificationsPermissionScreen → Expo Notifications permission request

── PROFILE SETUP (4-step indicator) ──────────────────────────────
OnboardingIntroScreen         → "Let's build your vibe" story screen
ProfilePhotoName              → Step 1/4 — 5 media slots + name
ProfileAgeGender              → Step 2/4 — age stepper + gender tiles (Male/Female/Both)
ProfileInterests              → Step 3/4 — interest chips (min 3)
ProfileTraits                 → Step 4/4 — personality trait chips (optional)
ProfileCompleteScreen         → Celebration → NoCircleScreen
```

### Auth Routing Logic
```
User opens app
       ↓
Firebase onAuthStateChanged
       ↓
No user → WelcomeScreen (01)
       ↓
User exists but no Firestore profile → ProfilePhotoName (resume setup)
       ↓
User exists + profile complete → HomeScreen (or NoCircleScreen)
```

---

## 16. ROLE SYSTEM

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

## 17. MEDIA ARCHITECTURE SUMMARY

```
User action                    Storage location
────────────────────────────────────────────────────────────────
Profile photo/video upload  →  Supabase: avatars/{userId}/media-{1..5}.jpg|mp4
                               Slot 1 = main (large), Slots 2–5 = secondary
Chat image send             →  Supabase: chat-media/{circleId}/images/{msgId}.jpg
Chat video send             →  Supabase: chat-media/{circleId}/videos/{msgId}.mp4
Chat audio send             →  Supabase: chat-media/{circleId}/audio/{msgId}.m4a
Media URL reference         →  Stored as string array in Firestore user document
Group call session          →  Livekit Cloud (no files stored)
Call E2EE key               →  Firestore: circles/{circleId}/callKey
```

### Profile Media Slots

```
avatars/{userId}/
├── media-1.jpg   ← MAIN slot (large display, star badge)
├── media-2.jpg   ← secondary
├── media-3.mp4   ← secondary (short video, play icon overlay)
├── media-4.jpg   ← secondary
└── media-5.jpg   ← secondary
```

Stored in Firestore as:
```javascript
users/{userId}
  mediaUrls: [
    "https://...media-1.jpg",  // index 0 = main
    "https://...media-2.jpg",
    "https://...media-3.mp4",
    ...
  ]
```

---

## 18. PACKAGES TO INSTALL

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

## 19. UI ARCHITECTURE & SCREEN REFERENCE

### Bottom Navigation (persistent in main app)
```
Tab 1: Home          → NoCircleScreen or HomeScreen
Tab 2: Swipe         → SwipeScreen (host) or SwipeCirclesScreen (joiner)
Tab 3: Notifications → NotificationsScreen
Tab 4: Profile       → ProfileScreen
```

### Screen Inventory

| Screen | Path | Description |
|--------|------|-------------|
| SplashScreen | `index.tsx` | Lottie logo animation |
| WelcomeScreen (01) | `(auth)/welcome.tsx` | Logo + social CTAs + email + login link |
| EmailSignUpScreen (02) | `(auth)/email-signup.tsx` | Bottom sheet — email + password sign up |
| LoginScreen (03) | `(auth)/login.tsx` | Returning user — email/password + social |
| OTPScreen | `(auth)/otp.tsx` | Phone/email verification |
| LocationPermissionScreen | `(auth)/location-permission.tsx` | GPS request |
| NotificationsPermissionScreen | `(auth)/notifications-permission.tsx` | Push request |
| OnboardingIntroScreen | `(auth)/onboarding-intro.tsx` | How Circles work |
| ProfilePhotoName | `(auth)/profile-photo-name.tsx` | Step 1/4 — 5 media slots + name |
| ProfileAgeGender | `(auth)/profile-age-gender.tsx` | Step 2/4 |
| ProfileInterests | `(auth)/profile-interests.tsx` | Step 3/4 |
| ProfileTraits | `(auth)/profile-traits.tsx` | Step 4/4 |
| ProfileCompleteScreen | `(auth)/profile-complete.tsx` | Celebration |
| NoCircleScreen | `circle/no-circle.tsx` | Create or Join CTA |
| HomeScreen | `(tabs)/home.tsx` | Active Circle dashboard |
| CreateCircleScreen | `circle/create.tsx` | Name, vibe, meetup details |
| CreateCirclePreferencesScreen | `circle/create-preferences.tsx` | Who to attract |
| JoinCirclePreferencesScreen | `circle/join-preferences.tsx` | What joiner wants |
| SwipeScreen | `circle/swipe-users.tsx` | Host swipes users |
| SwipeCirclesScreen | `circle/swipe-circles.tsx` | Joiner swipes Circles |
| SwipeEmptyScreen | `circle/swipe-empty.tsx` | No more cards |
| CircleProgressScreen | `circle/progress.tsx` | Circle filling up |
| CircleCompleteScreen | `circle/complete.tsx` | Circle full → enter chat |
| ChatScreen | `circle/chat.tsx` | Group chat |
| CallScreen | `circle/call.tsx` | E2EE group call |
| NotificationsScreen | `(tabs)/notifications.tsx` | Alerts + activity |
| ProfileScreen | `(tabs)/profile.tsx` | View profile + edit button |
| EditProfileScreen | `profile/edit.tsx` | Full profile editor |
| ModeratorDashboard | `moderator/dashboard.tsx` | Review reports |
| ReportDetailScreen | `moderator/report-detail.tsx` | Single report |
| AdminDashboard | `admin/dashboard.tsx` | All mod powers + role mgmt |
| UserManagementScreen | `admin/user-management.tsx` | Promote/demote users |

### Key Components

| Component | Purpose |
|-----------|---------|
| `StepIndicator` | 4-bar progress tracker for profile setup |
| `MediaGrid` | 1 main + 4 secondary photo/video slots with overlays |
| `DualSlider` | Dual-thumb range slider for age/radius |
| `ProfileCard` | Swipe card for users — shows media carousel |
| `CircleCard` | Swipe card for Circles — name, host, distance, capacity |
| `AvatarStack` | Overlapping member avatars with +N overflow badge |
| `CapacityBadge` | "2 / 5 spots" remaining indicator |
| `CircleProgress` | Visual fill as circle members join |

### Design Tokens
```typescript
// All colors via HSL semantic tokens
--primary         // #F5C518 warm yellow
--primary-soft    // #FFF3C4 light yellow tint
--secondary       // supporting accent
--muted-foreground // #6B6B6B secondary text
--background      // #FFFFFF
--card-radius     // 18px
--spacing-unit    // 8px grid
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
  2. Create storage buckets (avatars, chat-media) — leave private
  3. Run PostgreSQL schema SQL
  4. Add RLS policies (tables + storage)
  5. Implement supabase.ts service
  6. Update AuthContext to sync roles

Phase 3 — Onboarding UI
  7.  SplashScreen (Lottie — logo_animation.json)
  8.  WelcomeScreen (logo + tagline + Get Started)
  9.  OnboardingIntroScreen (how Circles work)
  10. OTPScreen (phone/email verification)
  11. LocationPermissionScreen
  12. NotificationsPermissionScreen
  13. ProfilePhotoName — Step 1/4
      → MediaGrid component (1 main + 4 secondary slots)
      → useImageUpload hook (up to 5 files)
  14. ProfileAgeGender — Step 2/4
      → age stepper + gender tiles (Male/Female/Both)
  15. ProfileInterests — Step 3/4
  16. ProfileTraits — Step 4/4
  17. ProfileCompleteScreen → NoCircleScreen

Phase 4 — No Circle State
  18. NoCircleScreen
      → "Create a Circle" primary CTA (Plus icon)
      → "Join a Circle" secondary CTA (Search icon)

Phase 5 — Host (Create) Flow
  19. CreateCircleScreen (name, vibe, meetup goal + timeframe)
  20. CreateCirclePreferencesScreen
      → DualSlider component (age range)
      → gender mix selector
      → interest + trait chips
  21. SwipeScreen — host swipes users
      → ProfileCard with media carousel
      → JOIN ✓ / SKIP ✕ overlays
  22. CircleProgressScreen (fills as members join)
  23. CircleCompleteScreen → unlocks chat

Phase 6 — Joiner Flow
  24. JoinCirclePreferencesScreen
      → radius slider (1–50+ km)
      → DualSlider (age range)
      → gender mix, vibe, interests, traits
  25. SwipeCirclesScreen — joiner swipes Circles
      → CircleCard component
      → Circle name, host, distance
      → CapacityBadge ("2 / 5 spots")
      → AvatarStack (overlapping members + N overflow)
      → JOIN ✓ / SKIP ✕ overlays
  26. SwipeEmptyScreen (no more profiles/circles)

Phase 7 — Chat + Media
  27. CircleChatScreen (text)
  28. useMediaUpload hook
  29. Media message sending (image/video/audio)
  30. MediaMessage component

Phase 8 — Calls
  31. Firebase Cloud Functions setup
  32. Livekit integration
  33. useCircleCall hook
  34. CallScreen UI (E2EE group call)

Phase 9 — Profile Management
  35. ProfileScreen (avatar, name, stats, Edit pill button)
  36. EditProfileScreen
      → mirrors onboarding fields
      → 5-slot MediaGrid with MAIN star badge + video play icon
      → edit overlays on each slot
      → Save header action + bottom Save button

Phase 10 — Moderation
  37. NotificationsScreen (match alerts, Circle activity)
  38. moderation.ts service
  39. ModeratorDashboard screen
  40. ReportDetailScreen
  41. AdminDashboard screen
  42. UserManagementScreen
```

---

## 20. SECURITY CHECKLIST

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
*Last updated: April 2026 — v1.2 (Full UI architecture + dual user journeys added)*
