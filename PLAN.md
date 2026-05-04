# SOCIO — IMPLEMENTATION PLAN
> Version 1.1 | Prepared by: Izu Obikanyi
> Last updated: April 2026
> Reference: ARCHITECTURE.md v1.3
> v1.1: Auth flow corrected — WelcomeScreen (01), EmailSignUpScreen (02), LoginScreen (03) added.

---

## HOW TO USE THIS DOCUMENT

This is your step-by-step build guide. Work through it top to bottom.

- Each task has a **Agent prompt** — copy and paste it directly
- Check off tasks as you complete them using `[x]`
- Never skip ahead — each phase depends on the previous one
- When in doubt, re-read `ARCHITECTURE.md` for the full context

---

## STATUS LEGEND

```
✅ Done
🔲 To do
🔄 In progress
⚠️  Blocked (waiting on something)
```

---

## PHASE 1 — FOUNDATION
> Status: ✅ COMPLETE

- [x] Firebase project created
- [x] Firebase Auth configured (Google + Email)
- [x] Firestore database created
- [x] Basic app scaffolded with Expo Router
- [x] `.env` file created with Firebase keys
- [x] `firebase.ts` service file
- [x] Basic navigation working
- [x] App runs on Android emulator

---

## PHASE 2 — SUPABASE SETUP
> Status: 🔲 TODO
> Estimated time: 1–2 hours
> Do all dashboard steps before writing any code.

### 2A. Dashboard Setup (no code)

- [ ] Create Supabase project at supabase.com
  - Name: `socio`
  - Region: West EU
  - Plan: Free

- [ ] Copy keys into `.env`:
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://{project-ref}.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY={publishable-key}
  ```

- [ ] Create storage bucket: `avatars` (leave public toggle OFF)
- [ ] Create storage bucket: `chat-media` (leave public toggle OFF)

- [ ] Run schema SQL in Supabase → SQL Editor:
  > Copy the full SQL from ARCHITECTURE.md section 5.4

- [ ] Run RLS table policies SQL in Supabase → SQL Editor:
  > Copy from ARCHITECTURE.md section 5.5

- [ ] Run storage policies SQL in Supabase → SQL Editor:
  > Copy from ARCHITECTURE.md section 5.6

### 2B. Code — Supabase Service

- [ ] Install Supabase package:
  ```bash
  npx expo install @supabase/supabase-js
  ```

**Agent prompt:**
```
Create src/services/supabase.ts using the Supabase client.
Implement the following exports:
- supabase client (using EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY)
- syncUserToSupabase(firebaseUser) — checks if user exists in Supabase users table,
  inserts with role 'user' and status 'active' if not, returns existing record if so.
  Uses Firebase UID as the primary key.
- getUserRole(uid) — fetches role, status, suspended_until from users table by uid
- uploadAvatar(userId, imageUri) — uploads to avatars/{userId}/profile.jpg in
  Supabase Storage, enforces 5MB limit, returns public URL
- uploadChatMedia(circleId, messageId, mediaUri, type) — uploads to
  chat-media/{circleId}/{type}s/{messageId}.{ext}, enforces size limits
  (image 5MB, video 50MB, audio 10MB), returns public URL.
Follow ARCHITECTURE.md section 6 exactly.
```

### 2C. Code — Update Auth Context

**Agent prompt:**
```
Update src/context/AuthContext.tsx to:
- Import syncUserToSupabase and getUserRole from src/services/supabase.ts
- After Firebase onAuthStateChanged fires with a user, call syncUserToSupabase
  then getUserRole to get role and status
- Store role ('user' | 'moderator' | 'admin') and status ('active' | 'suspended' | 'banned')
  in context state
- Expose convenience booleans: isUser, isModerator, isAdmin, isBanned, isSuspended
- If no firebase user, reset role and status to null
Follow ARCHITECTURE.md section 7 exactly.
```

### 2D. Code — Role-Based Navigation

**Agent prompt:**
```
Update app/_layout.tsx to implement role-based routing using useAuth() hook:
- If loading: return null (splash handles this)
- If status === 'banned': redirect to /banned screen
- If no user: redirect to /(auth)/welcome
- If role === 'admin': redirect to /admin/dashboard
- If role === 'moderator': redirect to /moderator/dashboard
- Otherwise: redirect to /(tabs)/home
Follow ARCHITECTURE.md section 8 exactly.
```

### 2E. Verify Phase 2

- [ ] App still runs after changes
- [ ] Login creates a user row in Supabase Table Editor
- [ ] No console errors related to Supabase

---

## PHASE 3 — ONBOARDING UI
> Status: 🔲 TODO
> Estimated time: 2–3 days
> Build screens in the exact order listed below.

### Design rules for every onboarding screen:
- White background
- Primary CTA: `#F5C518` yellow, black text, `borderRadius: 100`
- No shadows, no borders, no gradients
- `paddingHorizontal: 24` on all screens
- SafeAreaView on every screen

---

### TASK 3.1 — SplashScreen
**File:** `app/index.tsx`

- [ ] Install Lottie:
  ```bash
  npx expo install lottie-react-native
  ```

**Agent prompt:**
```
Build app/index.tsx as the SplashScreen:
- Full screen yellow (#F5C518) background
- Centered Lottie animation from assets/animations/logo_animation.json
  width: 160, height: 160
- "socio" text below animation: fontSize 36, fontWeight 800, color black
- Tagline: "Your circle starts here." fontSize 15, color rgba(0,0,0,0.6), marginTop 8
- Auto-navigate to /(auth)/welcome after animation completes using onAnimationFinish
  callback, or after 3 seconds as fallback using setTimeout
- Use useRouter from expo-router for navigation
```

---

### TASK 3.2 — WelcomeScreen (Screen 01)
**File:** `app/(auth)/welcome.tsx`
**Matches:** Screenshot 01 — WELCOME / SIGN UP

**Agent prompt:**
```
Build app/(auth)/welcome.tsx exactly matching this layout:

Top section (yellow #F5C518, ~45% of screen):
- Socio logo (3-dot people icon) centered, width 48, height 48, marginTop 48
- "One Circle." + line break + "Real friendships." 
  fontSize 34, fontWeight 800, black, textAlign center, marginTop 16
- Subtitle: "Form one meaningful friend group through shared interests and real-life meetups."
  fontSize 16, color rgba(0,0,0,0.65), textAlign center, marginTop 12, paddingHorizontal 32

Bottom section (white, ~55% of screen):
- No border radius on top — full rectangular join
- paddingHorizontal 24, paddingTop 32

Social buttons (full width, gap 12):
- "Continue with Google": backgroundColor #F5F5F5, borderRadius 100,
  paddingVertical 14, Google icon left-aligned, text centered, fontWeight 600
- "Continue with Facebook": same style, Facebook icon

Divider: thin #EFEFEF line, "or" centered, fontSize 14, color #6B6B6B, marginVertical 16

- "Sign up with Email": color #F5C518, fontWeight 700, fontSize 16, textAlign center
  On press: navigate to /(auth)/email-signup

Fine print: "By continuing you agree to our Terms & Privacy"
fontSize 12, color #AAAAAA, textAlign center, marginTop 16

- Divider line
- "Already have an account? Log in"
  fontSize 14, color #6B6B6B, textAlign center
  "Log in" portion: fontWeight 700, color #1A1A1A
  On press: navigate to /(auth)/login
```

---

### TASK 3.3 — EmailSignUpScreen (Screen 02)
**File:** `app/(auth)/email-signup.tsx`
**Matches:** Screenshot 02 — SIGN UP WITH EMAIL (SHEET)

**Agent prompt:**
```
Build app/(auth)/email-signup.tsx as a bottom sheet over a dimmed yellow backdrop:

Backdrop:
- Full screen yellow (#F5C518) background (simulates welcome screen behind)
- Semi-transparent dark overlay: backgroundColor rgba(0,0,0,0.3)
- Back arrow (←) top left inside a circular white button, size 36,
  On press: navigate back to welcome

Sheet (white, position absolute, bottom 0, full width):
- borderTopLeftRadius 28, borderTopRightRadius 28
- paddingHorizontal 24, paddingTop 32, paddingBottom safeArea + 24
- Drag indicator bar at top center:
  width 40, height 4, borderRadius 999, backgroundColor #EFEFEF, marginBottom 24

Sheet content:
- "Sign up with email" fontSize 28, fontWeight 800, black
- "Use your email to create an account." fontSize 15, color #6B6B6B, marginTop 4

Form fields (gap 16, marginTop 24):
- Email:
  Label: "Email" fontSize 14, fontWeight 500, color #1A1A1A, marginBottom 6
  Input: backgroundColor #F5F5F5, borderRadius 14, paddingVertical 14,
    paddingHorizontal 16, fontSize 15, placeholder "you@example.com"
    No border

- Password:
  Label: "Password" fontSize 14, fontWeight 500
  Input: same style, placeholder "••••••••", secureTextEntry
  Eye icon (👁) right side to toggle visibility
  Helper text below: "Min 8 characters, 1 number"
    fontSize 12, color #6B6B6B, marginTop 4

- "Create account" button (marginTop 24):
  backgroundColor #F5C518, black text, borderRadius 100,
  paddingVertical 16, full width, fontSize 16, fontWeight 700
  On press: Firebase createUserWithEmailAndPassword
  On success: navigate to /(auth)/otp

- "Already have an account? Log in" below button:
  fontSize 14, color #6B6B6B, textAlign center
  "Log in": fontWeight 700, color #1A1A1A
  On press: navigate to /(auth)/login
```

---

### TASK 3.4 — LoginScreen (Screen 03)
**File:** `app/(auth)/login.tsx`
**Matches:** Screenshot 03 — LOG IN (RETURNING USER)

**Agent prompt:**
```
Build app/(auth)/login.tsx as the full-screen returning user login:
- White background, paddingHorizontal 24
- Back arrow (←) top left: circular #F5F5F5 button, size 36, borderRadius 999
  On press: navigate back to /(auth)/welcome

Content (paddingTop 32):
- "Welcome back" fontSize 34, fontWeight 800, black
- "Log in to get back to your Circle." fontSize 16, color #6B6B6B, marginTop 4

Form fields (gap 16, marginTop 32):
- Email:
  Label: "Email" fontSize 14, fontWeight 500, marginBottom 6
  Input: backgroundColor #F5F5F5, borderRadius 14, paddingVertical 14,
    paddingHorizontal 16, fontSize 15, placeholder "alex@example.com", no border

- Password:
  Label row (flexDirection row, justifyContent space-between):
    "Password" label left
    "Forgot?" right: color #F5C518, fontWeight 600, fontSize 14
    On "Forgot?": Firebase sendPasswordResetEmail flow
  Input: same style, secureTextEntry, placeholder "••••••••"
    Eye icon right to toggle visibility

- "Log in" button (marginTop 24):
  backgroundColor #F5C518, black text, borderRadius 100,
  paddingVertical 16, full width, fontSize 16, fontWeight 700
  On press: Firebase signInWithEmailAndPassword
  On success:
    If Firestore user profile complete → navigate to /(tabs)/home
    If no profile → navigate to /(auth)/otp (new user somehow)

Divider (marginTop 24):
- "or continue with" text centered, fontSize 14, color #6B6B6B
- Thin #EFEFEF lines either side

Social buttons (gap 12, marginTop 16):
- "Google": backgroundColor #F5F5F5, borderRadius 100, paddingVertical 14,
  Google icon left, text centered, fontWeight 600, full width
- "Facebook": same style, Facebook icon

Footer (marginTop 32, textAlign center):
- "New to Socio?" color #6B6B6B + " Sign up" fontWeight 700, color #1A1A1A
  On press: navigate to /(auth)/welcome
```

**Agent prompt:**
```
Build app/(auth)/otp.tsx as the OTP verification screen:
- White background, back arrow top left (no button style, just icon)
- Title: "Verify Your Account" fontSize 32, fontWeight 800, black, marginTop 24
- Subtitle: "Enter the 4-digit code we sent you"
  fontSize 15, color #6B6B6B, marginTop 8
- 4 individual digit input boxes:
  Each: width 64, height 64, backgroundColor #F5F5F5, borderRadius 14
  fontSize 28, fontWeight 700, textAlign center
  Active box: 2px bottom border #F5C518 only (no full border)
  Error box: backgroundColor #FFF0F0
  Auto-focus moves to next box on input, back on delete
  Gap between boxes: 12
- "Didn't receive a code?" + "Resend" link in #F5C518 fontWeight 600, marginTop 24
- Yellow full-width "Continue" button sticky at bottom, borderRadius 100
- On success: navigate to /(auth)/location-permission
```

---

### TASK 3.5 — LocationPermissionScreen
**File:** `app/(auth)/location-permission.tsx`

- [ ] Install location package:
  ```bash
  npx expo install expo-location
  ```

**Agent prompt:**
```
Build app/(auth)/location-permission.tsx:
- White background, all content centered vertically
- Illustration (top 40% of content area):
  3 concentric circles, all centered using position absolute:
  Outer: size 180, backgroundColor #FFF3C4, borderRadius 999
  Middle: size 120, backgroundColor #F5C518, borderRadius 999
  Inner: size 40, backgroundColor white, borderRadius 999
- Title: "Can we find your people?"
  fontSize 32, fontWeight 800, black, textAlign center, marginTop 32
- Subtitle (2 lines max, centered):
  "We use your location to show you people nearby. We never share it publicly."
  fontSize 15, color #6B6B6B, lineHeight 22, marginTop 12
- Primary button: "Set Location Services"
  backgroundColor #F5C518, black text, borderRadius 100, paddingVertical 16
  On press: call expo-location requestForegroundPermissionsAsync()
  Then navigate to /(auth)/notifications-permission regardless of result
- Secondary button: "Maybe Later" — no background, no border,
  fontSize 15, color #6B6B6B, centered
- Fine print: "You can update this anytime in settings"
  fontSize 11, color #AAAAAA, centered, marginTop 12
```

---

### TASK 3.6 — NotificationsPermissionScreen
**File:** `app/(auth)/notifications-permission.tsx`

- [ ] Install notifications package:
  ```bash
  npx expo install expo-notifications
  ```

**Agent prompt:**
```
Build app/(auth)/notifications-permission.tsx:
- White background, all content centered vertically
- Illustration (top 40%): 3 stacked notification card shapes:
  Card 1 (back): width 200, height 52, borderRadius 14,
    backgroundColor #FFF3C4, transform rotate('-6deg')
  Card 2 (middle): width 220, height 52, borderRadius 14,
    backgroundColor #F5C518, opacity 0.6, transform rotate('-2deg')
  Card 3 (front): width 240, height 52, borderRadius 14,
    backgroundColor #F5C518, paddingHorizontal 16,
    flexDirection row, alignItems center,
    contains: bell icon + "Someone joined your Circle! 🎉"
    fontSize 13, fontWeight 600, black
  All cards centered using position absolute
- Title: "Don't miss a beat 🔔"
  fontSize 32, fontWeight 800, black, textAlign center, marginTop 32
- Subtitle: "We'll let you know when your Circle grows, someone accepts, or it's time to meet."
  fontSize 15, color #6B6B6B, lineHeight 22, marginTop 12, textAlign center
- Primary button: "Allow Notifications"
  backgroundColor #F5C518, black text, borderRadius 100, paddingVertical 16
  On press: call expo-notifications requestPermissionsAsync()
  Then navigate to /(auth)/onboarding-intro
- Secondary: "Not Now" — no background, no border, fontSize 15, color #6B6B6B
- Fine print: "You can change this in your phone settings"
  fontSize 11, color #AAAAAA, centered, marginTop 12
```

---

### TASK 3.7 — OnboardingIntroScreen
**File:** `app/(auth)/onboarding-intro.tsx`

**Agent prompt:**
```
Build app/(auth)/onboarding-intro.tsx as a warm intro before profile setup:
- White background
- Top decorative blob:
  View, full width, height 200, backgroundColor #F5C518
  borderBottomLeftRadius 48, borderBottomRightRadius 48
  Contains: Socio logo centered (width 56, height 56)
  + "socio" text: fontSize 20, fontWeight 800, black
- Below blob (paddingHorizontal 24, paddingTop 32):
  - Headline: "Let's build your vibe."
    fontSize 38, fontWeight 800, black, letterSpacing -1, marginBottom 16
  - Body (3 short paragraphs, gap 8 between, fontSize 16, color #6B6B6B, lineHeight 26):
    "We're going to ask you a few quick things."
    "Your name. Your interests. What kind of people you're looking for."
    "No pressure — just enough to find the right Circle for you. 🟡"
  - Step preview row (marginTop 32):
    4 pills in a row: [📸 Photo] [✏️ Name] [🎯 Interests] [✨ Traits]
    Each pill: backgroundColor #F5F5F5, borderRadius 100,
    paddingVertical 6, paddingHorizontal 12, fontSize 12, color #6B6B6B
    flexDirection row, gap 8, flexWrap wrap
- Sticky bottom button: "Let's do it"
  backgroundColor #F5C518, black text, borderRadius 100, paddingVertical 16
  Navigate to /(auth)/profile-photo-name
```

---

### TASK 3.8 — StepIndicator Component
**File:** `src/components/ui/StepIndicator.tsx`

**Agent prompt:**
```
Build src/components/ui/StepIndicator.tsx:
- Props: totalSteps (number), currentStep (number, 1-indexed)
- Renders a horizontal row of bars
- Each bar: flex 1, height 4, borderRadius 999
- Active or completed steps: backgroundColor #F5C518
- Inactive steps: backgroundColor #F5F5F5
- Gap between bars: 4
- Full width, marginHorizontal 0
- Export as default
```

---

### TASK 3.9 — MediaGrid Component
**File:** `src/components/ui/MediaGrid.tsx`

**Agent prompt:**
```
Build src/components/ui/MediaGrid.tsx for the profile photo/video upload grid:
- Props: mediaItems (array of {uri, type: 'image'|'video'} | null, max 5),
  onSlotPress(index: number)
- Layout: 1 large main slot (left, ~60% width) + 2x2 grid of 4 secondary slots (right)
- Main slot (index 0):
  - If filled: show image or video thumbnail
  - If video: show play icon overlay (▶ centered, white, fontSize 28)
  - MAIN star badge: position absolute top-right, backgroundColor #F5C518,
    borderRadius 999, padding 4, star icon or "★" text
  - Edit overlay on filled slot: semi-transparent dark overlay with pencil icon
  - If empty: backgroundColor #F5F5F5, plus icon centered, color #F5C518
- Secondary slots (index 1–4):
  - Smaller, same fill/empty/edit behavior as main
  - No star badge
  - If video: play icon overlay
- All slots: borderRadius 14, overflow hidden
- On press: call onSlotPress(index) so parent can trigger image picker
- Export as default
```

---

### TASK 3.10 — ProfilePhotoNameScreen
**File:** `app/(auth)/profile-photo-name.tsx`

- [ ] Install image picker:
  ```bash
  npx expo install expo-image-picker
  ```

**Agent prompt:**
```
Build app/(auth)/profile-photo-name.tsx as Step 1 of 4 profile setup:
- Import and show StepIndicator at top (totalSteps=4, currentStep=1)
- White background, paddingHorizontal 24
- Title: "First, a face to the name." fontSize 32, fontWeight 800, marginTop 24
- Subtitle: "Add photos so people know who they're connecting with."
  fontSize 15, color #6B6B6B, marginTop 8
- MediaGrid component below (marginTop 32)
  - On slot press: launch expo-image-picker launchImageLibraryAsync
    allowing both images and videos, allowsEditing true, aspect [1,1], quality 0.8
    For videos: videoMaxDuration 15 seconds
  - Store up to 5 selected media items in local state
- Name input below grid (marginTop 32):
  - Label: "WHAT DO PEOPLE CALL YOU?" fontSize 11, fontWeight 600,
    color #6B6B6B, letterSpacing 0.5, textTransform uppercase
  - Underline-style input: fontSize 24, fontWeight 700, textAlign center,
    backgroundColor transparent, borderBottomWidth 2,
    borderBottomColor #F5C518, paddingBottom 8
    placeholder "Your name" in #AAAAAA
- Sticky bottom "Continue" button: backgroundColor #F5C518, borderRadius 100
  Disabled (backgroundColor #F5F5F5, color #AAAAAA) if name is empty
- On continue: save name and mediaItems to a profileSetup context or local state,
  navigate to /(auth)/profile-age-gender
```

---

### TASK 3.11 — ProfileAgeGenderScreen
**File:** `app/(auth)/profile-age-gender.tsx`

**Agent prompt:**
```
Build app/(auth)/profile-age-gender.tsx as Step 2 of 4:
- StepIndicator (totalSteps=4, currentStep=2) at top
- White background, paddingHorizontal 24
- Title: "A little about you." fontSize 32, fontWeight 800, marginTop 24
- Subtitle: "This helps us find the right people for your Circle."
  fontSize 15, color #6B6B6B, marginTop 8

Age section (marginTop 40):
- Label: "HOW OLD ARE YOU?" typography.label style
- Large stepper row (flexDirection row, alignItems center, justifyContent center, gap 24):
  Minus button: width 48, height 48, borderRadius 999, backgroundColor #F5F5F5
    "−" fontSize 24, black
  Age number: fontSize 64, fontWeight 800, black, minWidth 100, textAlign center
  Plus button: same as minus but "+"
  Default age: 21, min 18, max 65

Gender section (marginTop 40):
- Label: "GENDER" typography.label style
- 3 tile options in a row (gap 8):
  Each tile: flex 1, paddingVertical 20, borderRadius 20, textAlign center
  Unselected: backgroundColor #F5F5F5
  Selected: backgroundColor #F5C518
  Content: emoji (fontSize 28) + label below (fontSize 13, fontWeight 600, black)
  Tiles: [👨 Male] [👩 Female] [🤝 Both]

- Sticky "Continue" button: backgroundColor #F5C518
- On continue: save age and gender, navigate to /(auth)/profile-interests
```

---

### TASK 3.12 — ProfileInterestsScreen
**File:** `app/(auth)/profile-interests.tsx`

**Agent prompt:**
```
Build app/(auth)/profile-interests.tsx as Step 3 of 4:
- StepIndicator (totalSteps=4, currentStep=3) at top
- White background, paddingHorizontal 24
- Title: "What are you into?" fontSize 32, fontWeight 800, marginTop 24
- Subtitle: "Pick things you genuinely love. This is how we find your people."
  fontSize 15, color #6B6B6B, marginTop 8
- Header row (marginTop 24):
  Left: "Pick at least 3" badge: backgroundColor #FFF3C4, borderRadius 100,
    padding 4 10, fontSize 12, color #E0A800, fontWeight 600
  Right: "[X] selected" counter: fontSize 13, color #F5C518, fontWeight 600, updates live
- ScrollView chip grid (marginTop 16, flexWrap wrap, gap 8):
  Interest options with emoji:
  🎵 Music | 📚 Books | 🎬 Film | ✈️ Travel | 🏋️ Fitness | 🍜 Food |
  🎮 Gaming | 🎨 Art | 🧘 Wellness | 📸 Photo | 🏕️ Outdoors | 🎭 Theatre |
  💻 Tech | 🌱 Nature | 🐾 Pets | 🏄 Sports | ☕ Coffee | 🎤 Singing
  Unselected chip: backgroundColor #F5F5F5, borderRadius 100,
    paddingVertical 12, paddingHorizontal 18, fontSize 13, color #6B6B6B
  Selected chip: backgroundColor #F5C518, color black, fontWeight 700
  "+ Add your own" chip at end: borderWidth 1.5, borderStyle dashed,
    borderColor #F5C518, borderRadius 100, backgroundColor transparent, color #F5C518
    On press: show a TextInput alert or bottom sheet to add custom interest
- Sticky "Continue" button: backgroundColor #F5C518
  Disabled if fewer than 3 selected: backgroundColor #F5F5F5, color #AAAAAA
- On continue: save interests, navigate to /(auth)/profile-traits
```

---

### TASK 3.13 — ProfileTraitsScreen
**File:** `app/(auth)/profile-traits.tsx`

**Agent prompt:**
```
Build app/(auth)/profile-traits.tsx as Step 4 of 4:
- StepIndicator (totalSteps=4, currentStep=4) at top
- White background, paddingHorizontal 24
- Title: "Last one. Promise. 😄" fontSize 32, fontWeight 800, marginTop 24
- Subtitle: "Pick traits that describe you. Totally optional but helps a lot."
  fontSize 15, color #6B6B6B, marginTop 8
- "Optional — skip if you want" badge:
  backgroundColor #F5F5F5, borderRadius 100, padding 4 12,
  fontSize 12, color #6B6B6B, marginTop 8
- Chip grid (marginTop 24, gap 8, same style as interests screen):
  🤫 Introverted | 🗣️ Extroverted | 🌊 Adventurous | ☕ Laid-back |
  📖 Intellectual | 😂 Funny | 🎯 Ambitious | 💡 Creative |
  🤝 Loyal | 🌍 Open-minded | 🏃 Active | 🎶 Artsy |
  🧠 Deep thinker | 🤸 Spontaneous
  No minimum required, multiple select allowed
- Bottom buttons (gap 12):
  Primary: "Complete Profile" backgroundColor #F5C518, black, borderRadius 100
  Secondary: "Skip for now" no background, no border, fontSize 15, color #6B6B6B
- On either button: save traits (empty array if skipped),
  navigate to /(auth)/profile-complete
```

---

### TASK 3.14 — ProfileCompleteScreen
**File:** `app/(auth)/profile-complete.tsx`

**Agent prompt:**
```
Build app/(auth)/profile-complete.tsx as the profile setup celebration screen:
- Full screen backgroundColor #F5C518
- All content centered vertically and horizontally

Animated rings (decorative, position absolute, centered):
- 3 concentric ring Views:
  Ring 1: size 200, borderRadius 999, borderWidth 3, borderColor black, opacity 0.08
  Ring 2: size 140, borderRadius 999, borderWidth 3, borderColor black, opacity 0.15
  Ring 3: size 80, borderRadius 999, borderWidth 3, borderColor black, opacity 0.25
- Animate each ring: scale 0.8 → 1 and opacity 1 → 0
  Staggered delays: 0ms, 200ms, 400ms, duration 1400ms, run once using Animated API

Main content (below rings, marginTop 220):
- "You're all set, [Name]! 🎉"
  fontSize 34, fontWeight 800, black, textAlign center, letterSpacing -1
- "Time to find your Circle."
  fontSize 18, color rgba(0,0,0,0.6), marginTop 8, textAlign center
- Show 3 of their selected interest chips below (marginTop 20):
  backgroundColor rgba(0,0,0,0.1), borderRadius 100,
  paddingVertical 8, paddingHorizontal 16, fontSize 13, color black, fontWeight 600
  flexDirection row, gap 8, justifyContent center

Sticky bottom button (paddingHorizontal 24):
- "Find My Circle"
  backgroundColor black, color white, borderRadius 100, paddingVertical 16
  fontSize 16, fontWeight 700
- Auto-navigate to /circle/no-circle after 3 seconds OR on button press

On navigate: save complete profile to Firestore users/{uid} document
and upload media files to Supabase using uploadAvatar from supabase.ts
```

---

## PHASE 4 — NO CIRCLE STATE
> Status: 🔲 TODO
> Estimated time: 2–3 hours

### TASK 4.1 — NoCircleScreen
**File:** `app/circle/no-circle.tsx`

**Agent prompt:**
```
Build app/circle/no-circle.tsx as the empty state when a user has no active Circle:
- White background, all content centered vertically
- Illustration: large circle shape
  size 200, borderRadius 999, backgroundColor #FFF3C4, centered
  Inside: Socio logo or abstract group icon, color #F5C518, fontSize 80

- Title: "No circle yet." fontSize 32, fontWeight 800, black, marginTop 24
- Subtitle: "Create your own Circle and choose who joins, or find an existing
  Circle to join." fontSize 15, color #6B6B6B, lineHeight 22, textAlign center

Two CTAs (marginTop 40, gap 12, paddingHorizontal 24):
- Primary: "Create a Circle"
  backgroundColor #F5C518, black text, borderRadius 100, paddingVertical 16
  Left icon: Plus (+) icon
  Navigate to /circle/create

- Secondary: "Join a Circle"
  backgroundColor #F5F5F5, black text, borderRadius 100, paddingVertical 16
  Left icon: Search icon
  Navigate to /circle/join-preferences
```

---

## PHASE 5 — HOST (CREATE) FLOW
> Status: 🔲 TODO
> Estimated time: 2–3 days

### TASK 5.1 — DualSlider Component
**File:** `src/components/ui/DualSlider.tsx`

**Agent prompt:**
```
Build src/components/ui/DualSlider.tsx as a dual-thumb range slider:
- Props: min (number), max (number), values ([number, number]),
  onChange([number, number]), unit (string, e.g. "km" or "yrs")
- Renders a track with two draggable thumb circles
- Track color: #F5F5F5
- Filled range between thumbs: #F5C518
- Each thumb: size 28, borderRadius 999, backgroundColor #F5C518,
  shadow: none
- Display current values above slider: "[min] — [max] [unit]"
  fontSize 22, fontWeight 800, black, textAlign center
- Use PanResponder or react-native-gesture-handler for drag behavior
- Export as default
```

---

### TASK 5.2 — CreateCircleScreen
**File:** `app/circle/create.tsx`

**Agent prompt:**
```
Build app/circle/create.tsx as Stage 1 of circle creation:
- White background, paddingHorizontal 24
- Header: back arrow left + "Create a Circle" fontSize 28, fontWeight 800, centered
- Scrollable content, sticky "Next" button at bottom

Fields (gap 24 between each section):

1. Circle Name:
   - Label: "CIRCLE NAME" typography.label
   - Input: backgroundColor #F5F5F5, borderRadius 14, paddingVertical 14,
     paddingHorizontal 16, fontSize 15, no border

2. Vibe / Description:
   - Label: "CIRCLE VIBE"
   - Multiline input: same style, minHeight 80, textAlignVertical top
   - Placeholder: "What's the energy of your Circle?"

3. Meetup Goal (horizontal chip selection):
   - Label: "MEETUP GOAL"
   - Chips: ☕ Coffee | 📚 Study | 🏋️ Gym | 🍜 Food | 🎬 Film | 🌿 Outdoors | 🎮 Gaming
   - Single select, same chip style as profile setup

4. Meetup Timeframe (horizontal chip selection):
   - Label: "WHEN"
   - Chips: This week | Within 3 days | This weekend | Flexible
   - Single select

5. Circle Size:
   - Label: "CIRCLE SIZE"
   - Stepper row: [−] [5] [+], min 3, max 8
   - Large center number: fontSize 48, fontWeight 800, color #F5C518

- "Next" button: backgroundColor #F5C518, borderRadius 100
  Disabled if name is empty
- On next: save to local state, navigate to /circle/create-preferences
```

---

### TASK 5.3 — CreateCirclePreferencesScreen
**File:** `app/circle/create-preferences.tsx`

**Agent prompt:**
```
Build app/circle/create-preferences.tsx as Stage 2 of circle creation:
- White background, paddingHorizontal 24
- Header: back arrow + "Who are you looking for?" fontSize 28, fontWeight 800
- Scrollable content, sticky "Create Circle" button at bottom

Sections (gap 32 between each):

1. Age Range:
   - Label: "AGE RANGE"
   - DualSlider component: min 18, max 65, unit "yrs", default [20, 30]

2. Gender Mix:
   - Label: "GENDER MIX"
   - 3 tiles: [👨 Male] [👩 Female] [🤝 Both]
   - Same tile style as ProfileAgeGenderScreen
   - Single select

3. Location Radius:
   - Label: "LOCATION RADIUS"
   - Single thumb slider (not dual): min 1, max 100
   - Display: "Within [X] km" fontSize 22, fontWeight 800
   - Toggle pill top right: [km] [miles], switches unit display

4. Interests (multi-select chips):
   - Label: "SHARED INTERESTS"
   - Same chip grid as profile setup (subset OK)
   - "Pick what you want your Circle to share"

5. Personality Traits (multi-select chips):
   - Label: "PERSONALITY TRAITS" (optional)
   - Same chip grid as profile traits screen
   - "Optional — skip if you want" note

- "Create Circle" button: backgroundColor #F5C518
- On press:
  1. Combine all circle data from state (from create.tsx + this screen)
  2. Save circle document to Firestore circles/{newCircleId}
  3. Set status: 'forming', members: [uid], creatorId: uid
  4. Update user's activeCircleId in Firestore
  5. Navigate to /circle/swipe-users
```

---

### TASK 5.4 — SwipeScreen (Host swipes users)
**File:** `app/circle/swipe-users.tsx`

**Agent prompt:**
```
Build app/circle/swipe-users.tsx where the host swipes through potential members:

Top bar (paddingHorizontal 24, paddingTop safeArea + 8):
- Left: Circle name (Typography h3) + "Your Circle" label below (color #6B6B6B)
- Right: member count badge "[current] / [total]"
  backgroundColor #FFF3C4, borderRadius 100, paddingVertical 6,
  paddingHorizontal 14, fontSize 14, fontWeight 700, color #E0A800

Progress bar (marginTop 12, marginHorizontal 24):
- height 6, borderRadius 999
- backgroundColor #F5F5F5, filled portion #F5C518
- Animate width change with Animated.timing, duration 400ms

Profile card (flex 1, marginHorizontal 16, marginTop 16):
- borderRadius 28, overflow hidden, backgroundColor white

  Photo section (top 58%):
  - Full width user photo
  - Placeholder: backgroundColor #FFF3C4, person icon centered
    color #F5C518, opacity 0.4, fontSize 80
  - Subtle gradient overlay at bottom of photo (transparent to rgba 0,0,0,0.12)
    height 60, position absolute, bottom 0

  Info section (bottom 42%):
  - padding 20
  - Name + age row: "[Name], [Age]" Typography h2 left
    + "🟡 Good match" badge right (backgroundColor #FFF3C4,
    borderRadius 100, padding 4 10, fontSize 11)
  - Bio: fontSize 15, 2 lines max, ellipsis, marginTop 6
  - Interests: horizontal scrollable small chips, marginTop 10
    Matched interests highlighted in #F5C518
  - Distance: "📍 [X] km away" fontSize 12, color #6B6B6B, marginTop 6

  Swipe overlays (position absolute, top 32):
  - Dragging right: "ADD ✓" label top-left
    backgroundColor #F5C518, borderRadius 12, padding 8 16
    fontSize 18, fontWeight 800, black, rotate -15deg
    opacity based on drag distance (0 at center, 1 at 80px drag)
  - Dragging left: "SKIP ✕" label top-right
    backgroundColor #F5F5F5, same style, rotate 15deg

Action buttons (bottom, paddingHorizontal 48, paddingVertical 20):
- Skip: size 64, borderRadius 999, backgroundColor #F5F5F5, ✕ icon color #6B6B6B
- Accept: size 64, borderRadius 999, backgroundColor #F5C518, ✓ icon color black, fontWeight 700
- Brief scale animation on Accept press: scale 1 → 1.15 → 1, 200ms

Swipe gesture (react-native-gesture-handler + reanimated):
- Pan gesture on card
- Rotate card on horizontal drag: max ±10deg
- On swipe right (>120px): add user to pendingJoiners in Firestore, show next card
- On swipe left (<-120px): skip, show next card
- Card flies off screen in swipe direction, next card scales up from behind

Match overlay (when joiner already liked this Circle — mutual match):
- Full screen rgba(0,0,0,0.85) overlay
- "It's a match! 🎉" fontSize 36, fontWeight 800, white, centered
- Both user avatars side by side (size 80, borderRadius 999,
  border 3px solid #F5C518, slight overlap)
- "You both want to be in the same Circle"
  fontSize 15, white, opacity 0.8, centered, marginTop 16
- Yellow "Keep Swiping" button
- White ghost "See Circle" button below
- Animate overlay in: scale 0.8→1, opacity 0→1, 350ms spring

Data: fetch users from Firestore matching Circle's filters
  Prioritize users who are in pendingJoiners array
  Stop showing cards when Circle is full
  On full: auto-navigate to /circle/progress
```

---

### TASK 5.5 — CircleProgressScreen
**File:** `app/circle/progress.tsx`

**Agent prompt:**
```
Build app/circle/progress.tsx showing the Circle filling up:
- White background, paddingHorizontal 24

Header:
- Circle name: Typography h1, marginTop 32
- "Your circle is forming" fontSize 15, color #6B6B6B, marginTop 4

Member slots row (marginTop 32, flexDirection row, justifyContent center):
- Show [circleSize] slots total
- Filled slots: circular Avatar (size 56, borderRadius 999)
- Empty slots: size 56, borderRadius 999, backgroundColor #F5F5F5
  with dashed ring: borderWidth 2, borderStyle dashed, borderColor #F5C518,
  opacity 0.5, borderRadius 999
- Overlap avatars: marginLeft -10 on each after first

Progress section (marginTop 32):
- "[X] of [Y] members" Typography h3, textAlign center
- Progress bar: height 10, borderRadius 999, backgroundColor #F5F5F5
  Filled portion: backgroundColor #F5C518
  Animated width, marginTop 12
- Status text: "2 more people to complete your Circle"
  fontSize 15, color #6B6B6B, textAlign center, marginTop 8

Buttons (marginTop 40, gap 12):
- Primary: "Continue Swiping" backgroundColor #F5C518, borderRadius 100
  Navigate back to /circle/swipe-users
- Ghost: "Edit Circle" fontSize 15, color #6B6B6B, centered, no background

Real-time: listen to Firestore circles/{circleId} for member count changes
When members.length === circleSize: navigate to /circle/complete
```

---

### TASK 5.6 — CircleCompleteScreen
**File:** `app/circle/complete.tsx`

**Agent prompt:**
```
Build app/circle/complete.tsx for when a Circle reaches its target size:
- Top 45%: backgroundColor #F5C518
  - "🎉" emoji: fontSize 64, textAlign center, marginTop safeArea + 24
  - "Your Circle is complete!" fontSize 32, fontWeight 800, black, textAlign center
- Bottom 55%: white, borderTopLeftRadius 32, borderTopRightRadius 32, paddingHorizontal 24

Content in white section:
- All member avatars in a row (overlap style, size 52, marginLeft -8 after first)
  marginTop 24, justifyContent center

- Meetup goal pill (marginTop 16):
  backgroundColor #FFF3C4, borderRadius 100, padding 8 16
  Text: "[emoji] [meetupGoal]" fontSize 15, fontWeight 600, color #E0A800

- Countdown display (marginTop 24, flexDirection row, alignItems baseline,
  justifyContent center, gap 8):
  Large number: fontSize 64, fontWeight 800, color #F5C518
  "days" label: fontSize 22, color #6B6B6B
  Based on meetupTimeframe selected during Circle creation

- "Enter Circle" button (marginTop 32):
  backgroundColor black, color white, borderRadius 100, paddingVertical 16
  Navigate to /circle/chat
```

---

## PHASE 6 — JOINER FLOW
> Status: 🔲 TODO
> Estimated time: 1–2 days

### TASK 6.1 — JoinCirclePreferencesScreen
**File:** `app/circle/join-preferences.tsx`

**Agent prompt:**
```
Build app/circle/join-preferences.tsx for joiners to specify what they want:
- White background, paddingHorizontal 24
- Header: back arrow + "Find your Circle" fontSize 28, fontWeight 800
- Scrollable content, sticky "Find Circles" button at bottom

Sections (gap 32):

1. Location Radius:
   - Label: "HOW FAR?" typography.label
   - Single slider: min 1, max 100
   - Display: "Within [X] km" fontSize 22, fontWeight 800
   - km / miles toggle pill (top right of section)

2. Age Range:
   - Label: "AGE RANGE"
   - DualSlider: min 18, max 65, unit "yrs"

3. Gender Mix:
   - Label: "CIRCLE GENDER MIX"
   - 3 tiles: Male | Female | Both

4. Meetup Vibe (chips):
   - Label: "MEETUP VIBE"
   - ☕ Coffee | 📚 Study | 🏋️ Gym | 🍜 Food | 🎬 Film | 🌿 Outdoors | 🎮 Gaming

5. Interests (multi-select chips):
   - Label: "SHARED INTERESTS"
   - Same interest chip grid

6. Personality Traits (optional chips):
   - Label: "PERSONALITY TRAITS"
   - Same trait chips, marked optional

- "Find Circles" button: backgroundColor #F5C518
- On press: save preferences, navigate to /circle/swipe-circles
```

---

### TASK 6.2 — AvatarStack Component
**File:** `src/components/ui/AvatarStack.tsx`

**Agent prompt:**
```
Build src/components/ui/AvatarStack.tsx:
- Props: avatarUrls (string[]), maxVisible (number, default 4),
  totalCount (number), size (number, default 36)
- Renders overlapping circular avatars with marginLeft: -(size * 0.3) after first
- Shows maxVisible avatars, then a "+N" overflow circle if totalCount > maxVisible
- Each avatar: borderRadius 999, size x size, border 2px white
- Overflow circle: backgroundColor #F5C518, borderRadius 999,
  same size, centered "+N" text fontSize 12, fontWeight 700, black
- Export as default
```

---

### TASK 6.3 — CapacityBadge Component
**File:** `src/components/ui/CapacityBadge.tsx`

**Agent prompt:**
```
Build src/components/ui/CapacityBadge.tsx:
- Props: current (number), total (number)
- Renders "[current] / [total] spots" in a pill badge
- Full: backgroundColor #FFF3C4, color #E0A800
- Nearly full (1 spot left): backgroundColor #FFE4E1, color #FF3B30
- Has space (2+ spots): backgroundColor #F5F5F5, color #6B6B6B
- Style: borderRadius 100, paddingVertical 4, paddingHorizontal 10,
  fontSize 12, fontWeight 600
- Export as default
```

---

### TASK 6.4 — SwipeCirclesScreen (Joiner swipes Circles)
**File:** `app/circle/swipe-circles.tsx`

**Agent prompt:**
```
Build app/circle/swipe-circles.tsx where the joiner swipes through Circles:
Similar structure to swipe-users.tsx but cards show Circles not users.

Top bar:
- "Find a Circle" Typography h2
- Preferences filter icon top right (tapping goes back to join-preferences)

Circle card (flex 1, marginHorizontal 16):
- borderRadius 28, overflow hidden, backgroundColor white

  Top section (45% of card):
  - Host's main profile photo (full width)
  - Gradient overlay at bottom

  Info section (55% of card):
  - padding 20
  - Circle name: Typography h2, left
  - CapacityBadge top right: "[current] / [total] spots"
  - Host row (marginTop 8):
    Small host avatar (size 24) + "Hosted by [name]"
    fontSize 13, color #6B6B6B
  - Meetup goal pill: "[emoji] [goal]"
    backgroundColor #FFF3C4, borderRadius 100, padding 4 10,
    fontSize 12, color #E0A800, marginTop 8
  - Distance: "📍 [X] km away" fontSize 12, color #6B6B6B, marginTop 4
  - AvatarStack (existing members, marginTop 12)
  - Shared interests chips (2-3 matched ones, small, marginTop 10)

  Swipe overlays:
  - Right: "JOIN ✓" backgroundColor #F5C518, same style as swipe-users
  - Left: "SKIP ✕" backgroundColor #F5F5F5

Action buttons: same as swipe-users (Skip ✕, Accept ✓)

Swipe behavior:
- On right swipe: add userId to circle's pendingJoiners in Firestore
  Show "Request sent! The host will review your profile" toast/overlay
- On left swipe: skip

Data: fetch circles from Firestore where:
  - status === 'forming'
  - members.length < size
  - filters match joiner's preferences
  - location within joiner's radius

When no more circles: navigate to /circle/swipe-empty
```

---

### TASK 6.5 — SwipeEmptyScreen
**File:** `app/circle/swipe-empty.tsx`

**Agent prompt:**
```
Build app/circle/swipe-empty.tsx for when there are no more cards to swipe:
- White background, all content centered
- Large "😔" or search illustration (simple, abstract)
- Title: "No more [users/circles] for now." fontSize 28, fontWeight 800, black
- Subtitle: "Try adjusting your filters or check back later."
  fontSize 15, color #6B6B6B, textAlign center
- Two buttons (gap 12, marginTop 32):
  Primary: "Adjust Filters" backgroundColor #F5C518, borderRadius 100
    → Navigate back to preferences screen
  Secondary: "Go Home" backgroundColor #F5F5F5, borderRadius 100, black text
    → Navigate to /(tabs)/home
```

---

## PHASE 7 — CHAT + MEDIA
> Status: 🔲 TODO
> Estimated time: 1–2 days

### TASK 7.1 — ChatScreen (text only first)
**File:** `app/circle/chat.tsx`

**Agent prompt:**
```
Build app/circle/chat.tsx as the group chat screen (text first, media second):
- White background

Header:
- Back arrow left
- Circle name: Typography h3, centered
- AvatarStack of members (maxVisible 4) below name
- Options menu (⋮) top right:
  Shows: Mute notifications | Leave Circle | Remove member (creator only)

Messages list (FlatList, inverted):
- Own messages (right aligned):
  backgroundColor #F5C518, color black
  borderRadius 18, borderBottomRightRadius 4
  padding 10 14, maxWidth '75%'
  No avatar shown

- Others' messages (left aligned):
  backgroundColor #F5F5F5, color #1A1A1A
  borderRadius 18, borderBottomLeftRadius 4
  padding 10 14, maxWidth '75%'
  Small avatar (size 28) left of bubble
  Sender name above bubble: fontSize 11, color #6B6B6B

- Timestamp below each message: fontSize 10, color #AAAAAA

Message input bar (bottom, above keyboard):
- backgroundColor #F5F5F5, borderRadius 100
- paddingHorizontal 16, paddingVertical 10
- Placeholder: "Message..."
- Attach icon (📎) left of input (for Phase 7 media)
- Send button: circular size 36, backgroundColor #F5C518
  Arrow icon (→) in black

Real-time: listen to Firestore circles/{circleId}/messages
Order by timestamp ascending
On send: add message document to Firestore with senderId, senderName, text, timestamp
```

---

### TASK 7.2 — Media Upload Hook
**File:** `src/hooks/useMediaUpload.ts`

**Agent prompt:**
```
Build src/hooks/useMediaUpload.ts following ARCHITECTURE.md section 6.
- Install expo-document-picker: npx expo install expo-document-picker
- Implement pickImage(messageId), pickVideo(messageId), pickAudio(messageId)
- Each picker calls uploadChatMedia from supabase.ts with the correct type
- Returns { pickImage, pickVideo, pickAudio, uploading, progress }
- Enforce size limits before upload (image 5MB, video 50MB, audio 10MB)
- Show error if file too large
```

---

### TASK 7.3 — Add Media to Chat
**Agent prompt:**
```
Update app/circle/chat.tsx to support media messages:
- Attach icon (📎) in input bar opens an action sheet with 3 options:
  📷 Photo | 🎬 Video (15s max) | 🎵 Audio
- Each calls the appropriate picker from useMediaUpload hook
- While uploading: show a sending indicator in the message list
- On upload complete: save message to Firestore with type and mediaUrl
- Build MediaMessage component (src/components/chat/MediaMessage.tsx):
  - type 'image': show Image component with the mediaUrl
  - type 'video': show Video thumbnail with play button overlay
    On press: open full-screen video player
  - type 'audio': show waveform-style bar + play/pause button + duration
  All in the same bubble style as text messages
```

---

## PHASE 8 — E2EE GROUP CALLS
> Status: 🔲 TODO
> Estimated time: 1–2 days

### TASK 8.1 — Firebase Cloud Functions

- [ ] Initialize Firebase Functions:
  ```bash
  firebase init functions
  # Choose JavaScript, yes to ESLint, yes to install deps
  ```

- [ ] Install LiveKit server SDK:
  ```bash
  cd functions
  npm install livekit-server-sdk
  cd ..
  ```

- [ ] Set LiveKit secrets:
  ```bash
  firebase functions:config:set \
    livekit.api_key="YOUR_LIVEKIT_API_KEY" \
    livekit.api_secret="YOUR_LIVEKIT_API_SECRET"
  ```

**Agent prompt:**
```
Write functions/index.js with a getLivekitToken Firebase Cloud Function:
- Use functions.https.onCall
- Reject unauthenticated requests with HttpsError 'unauthenticated'
- Accept { circleId, userName } from data
- Read API key and secret from functions.config().livekit
- Create an AccessToken from livekit-server-sdk with:
  identity: context.auth.uid
  name: userName
  ttl: '2h'
- Add room grant: room=circleId, roomJoin=true, canPublish=true, canSubscribe=true
- Return { token: await token.toJwt() }
Follow ARCHITECTURE.md section 12 exactly.
```

- [ ] Deploy:
  ```bash
  firebase deploy --only functions
  ```

---

### TASK 8.2 — Livekit Service + Hook

- [ ] Install LiveKit packages:
  ```bash
  npx expo install @livekit/react-native
  npx expo install @livekit/react-native-webrtc
  ```

**Agent prompt:**
```
Build src/services/livekit.ts and src/hooks/useCircleCall.ts
following ARCHITECTURE.md sections 11 and the useCircleCall hook section exactly.
Key points:
- E2EE is configured in code, NOT in the LiveKit dashboard
- Use ExternalE2EEKeyProvider and pass sharedKey from Firestore
- generateSharedKey uses crypto.subtle.generateKey (AES-GCM 128)
- getCircleCallKey fetches or creates callKey in circles/{circleId} Firestore doc
- joinCircleCall connects to room with token + E2EE key provider
- useCircleCall exposes: startCall, endCall, inCall, loading, room
```

---

### TASK 8.3 — CallScreen
**File:** `app/circle/call.tsx`

**Agent prompt:**
```
Build app/circle/call.tsx as the E2EE group call screen:
- Dark background (#1A1A1A)
- Use useCircleCall hook with circleId and current user's name

Layout:
- Remote participants grid (takes up ~80% of screen):
  2x2 or dynamic grid based on participant count
  Each participant tile: rounded rectangle, backgroundColor #2A2A2A
    - Video feed if camera on
    - Large avatar + name if camera off
    - Mute indicator (🔇) if microphone off

- Local preview (bottom right corner):
  Small pip (picture-in-picture): width 90, height 120, borderRadius 14
  Semi-transparent overlay with own video

Controls bar (bottom, paddingBottom safeArea):
  backgroundColor #1A1A1A
  flexDirection row, justifyContent space-evenly
  Buttons (circular, size 56):
  - Microphone toggle: on=backgroundColor #2A2A2A, off=backgroundColor #FF3B30
  - Camera toggle: same pattern
  - End call: backgroundColor #FF3B30, phone-down icon, white
    On press: call endCall() from hook, navigate back to chat

- Circle name + member count at top: white text
- "E2EE Encrypted" badge: small pill, backgroundColor rgba(52,199,89,0.2),
  color #34C759, fontSize 11, top of screen
```

---

## PHASE 9 — PROFILE MANAGEMENT
> Status: 🔲 TODO
> Estimated time: 1 day

### TASK 9.1 — ProfileScreen
**File:** `app/(tabs)/profile.tsx`

**Agent prompt:**
```
Build app/(tabs)/profile.tsx:
- White background, paddingHorizontal 24

Top section:
- Large avatar (size 100, borderRadius 999) from user's mediaUrls[0]
- Name below: Typography h2, textAlign center, marginTop 12
- City + age: fontSize 15, color #6B6B6B, textAlign center, marginTop 4
- "Edit Profile" pill button (Pencil icon left):
  backgroundColor #F5C518, borderRadius 100, paddingVertical 10,
  paddingHorizontal 20, fontWeight 600, black, marginTop 16
  Navigate to /profile/edit

Stats row (marginTop 24, flexDirection row, justifyContent space-evenly):
- "Circles formed", "Members met" — each with large number + label below
  fontSize 28, fontWeight 800 for number

Interests section (marginTop 24):
- Label: "INTERESTS" typography.label
- Chip grid (read-only, same chip style, backgroundColor #FFF3C4, color #E0A800)

Traits section:
- Label: "PERSONALITY"
- Same chip style

Settings list (marginTop 32, separated by #EFEFEF dividers):
- Notifications (chevron →)
- Privacy (chevron →)
- Help & Support (chevron →)

Danger zone (marginTop 32, centered):
- "Log out" → Firebase signOut(), color #6B6B6B
- "Delete account" → confirmation modal, color #FF3B30
Both as plain text links, not buttons
```

---

### TASK 9.2 — EditProfileScreen
**File:** `app/profile/edit.tsx`

**Agent prompt:**
```
Build app/profile/edit.tsx as the full profile editor:
- White background
- Header: "Save" text button top right (color #F5C518, fontWeight 600)
  + "Edit Profile" title centered + back arrow left

Scrollable content (paddingHorizontal 24):

1. MediaGrid (same component, pre-populated with existing mediaUrls):
   - Allows replacing any slot
   - MAIN badge on slot 0
   - Video slots show play icon
   - Edit overlay on each filled slot

2. Name input (underline style, same as profile setup)

3. Age stepper (same as ProfileAgeGenderScreen)

4. Gender tiles (same 3-tile selector)

5. Bio textarea:
   - Label: "BIO"
   - Multiline input, backgroundColor #F5F5F5, borderRadius 14, minHeight 80

6. Interests chip grid (same, editable):
   - Pre-select existing interests
   - "+ Add your own" chip

7. Personality traits chip grid:
   - Pre-select existing traits

Bottom "Save" button (sticky):
- backgroundColor #F5C518, borderRadius 100, paddingVertical 16
- On press:
  1. Upload any changed media slots to Supabase
  2. Update Firestore users/{uid} with all changes
  3. Navigate back to ProfileScreen
```

---

## PHASE 10 — MODERATION
> Status: 🔲 TODO
> Estimated time: 1–2 days

### TASK 10.1 — Notifications Screen
**File:** `app/(tabs)/notifications.tsx`

**Agent prompt:**
```
Build app/(tabs)/notifications.tsx:
- White background
- Title: "Notifications" Typography h1, paddingHorizontal 24, paddingTop 24

Notification list (FlatList):
Each item (paddingVertical 14, paddingHorizontal 24,
borderBottom 1px #EFEFEF):
- Left: Yellow dot (size 8, borderRadius 999, backgroundColor #F5C518)
  for unread, transparent for read
- Middle (flex 1, paddingHorizontal 12):
  Title: fontWeight 600, fontSize 15, black (bold if unread)
  Subtitle: fontSize 13, color #6B6B6B, marginTop 2
- Right: timestamp fontSize 11, color #AAAAAA

Notification types:
- Match: "Someone wants to join your Circle! 👋" + circle name
- Circle full: "Your Circle is complete! 🎉" + circle name
- Reminder: "Your Circle is still forming" + "Continue swiping"
- Joined: "You've been added to [Circle name]!" (for joiners)

Fetch from Firestore notifications/{userId}/items collection
Mark as read when tapped
```

---

### TASK 10.2 — Moderation Service

**Agent prompt:**
```
Create src/services/moderation.ts following ARCHITECTURE.md section 9 exactly.
Implement all exports:
- reportUser(payload)
- getPendingReports()
- resolveReport(reportId, moderatorId, resolution)
- banUser(moderatorId, targetUserId, reason)
- suspendUser(moderatorId, targetUserId, reason, days)
- unbanUser(moderatorId, targetUserId)
- promoteUser(adminId, targetUserId, newRole)
- demoteUser(adminId, targetUserId)
All moderation actions must write to moderation_logs table via logAction helper.
```

---

### TASK 10.3 — Moderator Dashboard
**File:** `app/moderator/dashboard.tsx`

**Agent prompt:**
```
Build app/moderator/dashboard.tsx:
- White background, paddingHorizontal 24
- Header: "Moderator Dashboard" Typography h1
- Stats row: "Pending Reports" count, "Resolved Today" count
  Pull from Supabase reports table

Reports list (FlatList):
Each report card (backgroundColor #F5F5F5, borderRadius 14, padding 16, marginBottom 12):
- Reported user: avatar + name + status badge
- Reporter: "Reported by [name]"
- Reason: chip (backgroundColor #FFE4E1, color #FF3B30, borderRadius 100)
- Time: fontSize 11, color #AAAAAA
- "Review" button: backgroundColor #F5C518, borderRadius 100, small

Tabs at top: "Pending" | "Reviewed" | "Dismissed"
Filter by status

On "Review" tap: navigate to /moderator/report-detail with reportId
```

---

### TASK 10.4 — Report Detail Screen
**File:** `app/moderator/report-detail.tsx`

**Agent prompt:**
```
Build app/moderator/report-detail.tsx:
- White background, paddingHorizontal 24
- Header: back arrow + "Report Detail"

Reported user card:
- Avatar, name, age, interests chips
- Status badge (active/suspended/banned)
- Account created date

Report details:
- Reason chip
- Reporter name
- Optional details text
- Timestamp

Action buttons (gap 12, marginTop 32):
- "Dismiss Report" backgroundColor #F5F5F5, borderRadius 100
  → resolveReport(id, modId, 'dismissed')
- "Warn User" backgroundColor #FFF3C4, borderRadius 100, color #E0A800
  → (for now: just resolve as reviewed)
- "Suspend 7 Days" backgroundColor #FFE4E1, borderRadius 100, color #FF3B30
  → suspendUser(modId, targetId, reason, 7)
- "Permanent Ban" backgroundColor #FF3B30, borderRadius 100, color white
  → confirmation modal first → banUser(modId, targetId, reason)

All actions navigate back to dashboard after completion
```

---

### TASK 10.5 — Admin Dashboard
**File:** `app/admin/dashboard.tsx`

**Agent prompt:**
```
Build app/admin/dashboard.tsx:
- All moderator powers plus role management
- Stats cards row: Total Users | Active Circles | Pending Reports | Banned Users
- Quick actions: "View Reports" → moderator/dashboard, "Manage Users" → admin/user-management
- Recent moderation log list (from moderation_logs table):
  Each entry: moderator name + action + target user + timestamp
```

---

### TASK 10.6 — User Management Screen
**File:** `app/admin/user-management.tsx`

**Agent prompt:**
```
Build app/admin/user-management.tsx:
- Search bar at top (filter by name or email)
- User list (FlatList):
  Each user row: avatar + name + email + role badge + status badge
  Role badge colors: user=#F5F5F5 | moderator=#FFF3C4 | admin=#F5C518
  Status badge: active=green | suspended=orange | banned=red
- On tap: show action sheet with role options:
  "Promote to Moderator" | "Promote to Admin" | "Demote to User"
  | "Suspend" | "Ban" | "Unban"
- Each action calls the appropriate function from moderation.ts
- Confirm modal before any destructive action
```

---

## FINAL CHECKLIST BEFORE LAUNCH

### Functionality
- [ ] Both user journeys work end to end (Host + Joiner)
- [ ] Mutual matching logic works correctly
- [ ] Media uploads work (photos, videos, audio)
- [ ] Group chat is real-time
- [ ] E2EE calls connect and disconnect cleanly
- [ ] Notifications fire for match, circle full, reminders
- [ ] Role routing works (user / moderator / admin)
- [ ] Banned users see BannedScreen and cannot access app

### Security
- [ ] `.env` is in `.gitignore`
- [ ] LiveKit API secret is only in Firebase Functions config
- [ ] Supabase RLS is enabled on all tables
- [ ] Supabase storage policies are active on both buckets
- [ ] E2EE call keys never leave Firestore
- [ ] File size limits enforced before upload

### Polish
- [ ] No crashes on Android emulator
- [ ] No shadows, borders, or gradients anywhere
- [ ] All CTAs are #F5C518 with black text
- [ ] SafeAreaView on every screen
- [ ] Keyboard avoidance on all screens with inputs
- [ ] Loading states on all async actions
- [ ] Empty states for all lists
- [ ] Error handling on all Supabase and Firebase calls

---

*Reference ARCHITECTURE.md for full technical details on any task.*
*Last updated: April 2026 — v1.0*
