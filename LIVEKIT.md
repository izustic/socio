Implement E2EE group video/audio calls for the Socio app using LiveKit.
Read ARCHITECTURE.md section 9 before starting. The call is triggered
from the Circle chat screen (app/circle/chat.tsx) via a Phone icon
button that already exists in the header.

We use Supabase as the single backend. Token generation is handled by
a Supabase Edge Function. The call screen lives at app/circle/call.tsx.

---

## STEP 1 — INSTALL PACKAGES

Run these commands:

npx expo install @livekit/react-native
npx expo install @livekit/react-native-webrtc

Then add this to app.json plugins array if not already present:
"@livekit/react-native"

---

## STEP 2 — SUPABASE EDGE FUNCTION

Create the file: supabase/functions/get-livekit-token/index.ts

Use EXACTLY this implementation from ARCHITECTURE.md section 9:

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

---

## STEP 3 — LIVEKIT SERVICE

Create src/services/livekit.ts:

```typescript
import { supabase } from './supabase';

export const getLivekitToken = async (
  circleId: string,
  userId: string,
  userName: string
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('get-livekit-token', {
    body: { circleId, userId, userName },
  });

  if (error) throw new Error(`Failed to get LiveKit token: ${error.message}`);
  if (!data?.token) throw new Error('No token returned from Edge Function');

  return data.token;
};
```

---

## STEP 4 — useCircleCall HOOK

Create src/hooks/useCircleCall.ts:

This hook manages the full call lifecycle:
- Fetching the token from the Supabase Edge Function
- Connecting to the LiveKit room
- Managing mic and camera toggle state
- Tracking remote participants
- Disconnecting cleanly on leave

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioTrack,
  ConnectionState,
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
  VideoTrack,
} from '@livekit/react-native';
import { getLivekitToken } from '../services/livekit';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL!;

export interface CallParticipant {
  identity: string;
  name: string;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isLocal: boolean;
  participant: Participant;
}

export const useCircleCall = (
  circleId: string,
  userId: string,
  userName: string
) => {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectionState === ConnectionState.Connected;
  const isConnecting = connectionState === ConnectionState.Connecting;

  const buildParticipantList = useCallback((room: Room) => {
    const list: CallParticipant[] = [];

    // Add local participant first
    const local = room.localParticipant;
    list.push({
      identity: local.identity,
      name: local.name ?? local.identity,
      isMicEnabled: local.isMicrophoneEnabled,
      isCameraEnabled: local.isCameraEnabled,
      isLocal: true,
      participant: local,
    });

    // Add remote participants
    room.remoteParticipants.forEach((remote) => {
      list.push({
        identity: remote.identity,
        name: remote.name ?? remote.identity,
        isMicEnabled: remote.isMicrophoneEnabled,
        isCameraEnabled: remote.isCameraEnabled,
        isLocal: false,
        participant: remote,
      });
    });

    setParticipants(list);
  }, []);

  const connect = useCallback(async () => {
    if (roomRef.current) return;

    try {
      setError(null);
      const token = await getLivekitToken(circleId, userId, userName);

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      // Room event listeners
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setConnectionState(state);
      });

      room.on(RoomEvent.ParticipantConnected, () => buildParticipantList(room));
      room.on(RoomEvent.ParticipantDisconnected, () => buildParticipantList(room));
      room.on(RoomEvent.TrackPublished, () => buildParticipantList(room));
      room.on(RoomEvent.TrackUnpublished, () => buildParticipantList(room));
      room.on(RoomEvent.TrackMuted, () => buildParticipantList(room));
      room.on(RoomEvent.TrackUnmuted, () => buildParticipantList(room));

      room.on(RoomEvent.Disconnected, () => {
        setConnectionState(ConnectionState.Disconnected);
        setParticipants([]);
        roomRef.current = null;
      });

      await room.connect(LIVEKIT_URL, token);

      // Enable camera and mic on join
      await room.localParticipant.enableCameraAndMicrophone();

      setIsMicEnabled(true);
      setIsCameraEnabled(true);
      buildParticipantList(room);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to call';
      setError(message);
      roomRef.current = null;
      setConnectionState(ConnectionState.Disconnected);
    }
  }, [circleId, userId, userName, buildParticipantList]);

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.disconnect();
    roomRef.current = null;
    setParticipants([]);
    setConnectionState(ConnectionState.Disconnected);
  }, []);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const enabled = !isMicEnabled;
    await room.localParticipant.setMicrophoneEnabled(enabled);
    setIsMicEnabled(enabled);
    buildParticipantList(room);
  }, [isMicEnabled, buildParticipantList]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const enabled = !isCameraEnabled;
    await room.localParticipant.setCameraEnabled(enabled);
    setIsCameraEnabled(enabled);
    buildParticipantList(room);
  }, [isCameraEnabled, buildParticipantList]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  return {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    connectionState,
    isConnected,
    isConnecting,
    participants,
    isMicEnabled,
    isCameraEnabled,
    error,
  };
};
```

---

## STEP 5 — CALL SCREEN

Create app/circle/call.tsx

This is the full E2EE call screen. It receives circleId, userId, and
userName from route params or from AuthContext + the active circle.

Design rules (from design system):
- Dark background: #1A1A1A for the call screen
- Primary accent: #FFB60C for active/enabled states
- No shadows, no borders
- Pill buttons: borderRadius 100
- SafeAreaView on every screen

Screen layout:
┌─────────────────────────────────┐
│  "E2EE Encrypted 🔒"  [X members]  │  ← top bar
├─────────────────────────────────┤
│                                 │
│   PARTICIPANT VIDEO GRID        │  ← fills remaining space
│   (2x2 or dynamic based on      │
│    participant count)           │
│                                 │
├─────────────────────────────────┤
│  [MIC]  [CAMERA]  [END CALL]    │  ← controls bar
└─────────────────────────────────┘

Full implementation:

```typescript
import { useAuth } from '@/src/context/AuthContext';
import { useCircleCall, CallParticipant } from '@/src/hooks/useCircleCall';
import { Colors, Spacing, Typography } from '@/src/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView } from '@livekit/react-native';

export default function CallScreen() {
  const { user, profile } = useAuth();
  const params = useLocalSearchParams<{ circleId?: string; circleName?: string }>();

  const circleId = params.circleId ?? '';
  const circleName = params.circleName ?? 'Circle';
  const userId = user?.id ?? '';
  const userName = profile?.name ?? user?.email?.split('@')[0] ?? 'Member';

  const {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    isConnected,
    isConnecting,
    participants,
    isMicEnabled,
    isCameraEnabled,
    error,
  } = useCircleCall(circleId, userId, userName);

  // Auto-connect on mount
  useEffect(() => {
    if (circleId && userId) {
      connect();
    }
  }, []);

  // Show error and go back
  useEffect(() => {
    if (error) {
      Alert.alert('Call failed', error, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [error]);

  const handleEndCall = async () => {
    await disconnect();
    router.back();
  };

  // Participant tile component
  const ParticipantTile = ({ participant }: { participant: CallParticipant }) => (
    <View style={styles.participantTile}>
      {participant.isCameraEnabled ? (
        <VideoView
          style={styles.videoView}
          trackRef={{
            participant: participant.participant,
            source: Track.Source.Camera,
          }}
          objectFit="cover"
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {(participant.name ?? 'M')[0].toUpperCase()}
          </Text>
        </View>
      )}

      {/* Name + mute indicator */}
      <View style={styles.participantLabel}>
        {!participant.isMicEnabled && (
          <MicOff size={12} color={Colors.white} strokeWidth={2} />
        )}
        <Text numberOfLines={1} style={styles.participantName}>
          {participant.isLocal ? 'You' : participant.name}
        </Text>
      </View>
    </View>
  );

  // Loading state
  if (isConnecting || (!isConnected && !error)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.connectingText}>Joining call...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.encryptedBadge}>
          <Text style={styles.encryptedText}>🔒 E2EE Encrypted</Text>
        </View>
        <Text style={styles.memberCount}>
          {participants.length} {participants.length === 1 ? 'member' : 'members'}
        </Text>
      </View>

      {/* Participant grid */}
      <View style={styles.grid}>
        {participants.length === 0 ? (
          <View style={styles.emptyCall}>
            <Text style={styles.emptyCallText}>Waiting for others to join...</Text>
          </View>
        ) : (
          <View style={[
            styles.participantGrid,
            participants.length <= 2 && styles.gridSingle,
            participants.length >= 3 && styles.gridQuad,
          ]}>
            {participants.map((p) => (
              <ParticipantTile key={p.identity} participant={p} />
            ))}
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>

        {/* Microphone toggle */}
        <TouchableOpacity
          onPress={toggleMic}
          style={[styles.controlButton, !isMicEnabled && styles.controlButtonOff]}
          activeOpacity={0.76}
          accessibilityLabel={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicEnabled
            ? <Mic size={24} color={Colors.textPrimary} strokeWidth={2} />
            : <MicOff size={24} color={Colors.white} strokeWidth={2} />
          }
        </TouchableOpacity>

        {/* Camera toggle */}
        <TouchableOpacity
          onPress={toggleCamera}
          style={[styles.controlButton, !isCameraEnabled && styles.controlButtonOff]}
          activeOpacity={0.76}
          accessibilityLabel={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraEnabled
            ? <Video size={24} color={Colors.textPrimary} strokeWidth={2} />
            : <VideoOff size={24} color={Colors.white} strokeWidth={2} />
          }
        </TouchableOpacity>

        {/* End call */}
        <TouchableOpacity
          onPress={handleEndCall}
          style={styles.endCallButton}
          activeOpacity={0.76}
          accessibilityLabel="End call"
        >
          <PhoneOff size={26} color={Colors.white} strokeWidth={2} />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  connectingText: {
    ...Typography.body,
    color: Colors.textDisabled,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  encryptedBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  encryptedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  memberCount: {
    ...Typography.bodySmall,
    color: Colors.textDisabled,
  },
  grid: {
    flex: 1,
    padding: Spacing.sm,
  },
  participantGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridSingle: {
    flexDirection: 'column',
  },
  gridQuad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantTile: {
    flex: 1,
    minWidth: '45%',
    minHeight: 180,
    backgroundColor: '#2A2A2A',
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoView: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  participantLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  participantName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    maxWidth: 100,
  },
  emptyCall: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCallText: {
    ...Typography.body,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonOff: {
    backgroundColor: '#FF3B30',
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## STEP 6 — WIRE UP THE PHONE BUTTON IN CHAT SCREEN

In app/circle/chat.tsx, the Phone icon button already exists in the
header. Update its onPress to navigate to the call screen with params:

```typescript
// Find this touchable in the header:
<TouchableOpacity
  activeOpacity={0.76}
  style={styles.iconButton}
  onPress={() => router.push("/circle/call")}
>
  <Phone size={20} color={Colors.textPrimary} strokeWidth={2.2} />
</TouchableOpacity>

// Update to pass circleId and circleName as params:
<TouchableOpacity
  activeOpacity={0.76}
  style={styles.iconButton}
  onPress={() => router.push({
    pathname: '/circle/call',
    params: {
      circleId: circle?.id,
      circleName: circle?.name,
    },
  })}
>
  <Phone size={20} color={Colors.textPrimary} strokeWidth={2.2} />
</TouchableOpacity>
```

---

## STEP 7 — DEPLOY THE EDGE FUNCTION

Run these in your terminal from the project root:

```bash
# Deploy the edge function
supabase functions deploy get-livekit-token

# Set the LiveKit secrets on Supabase
supabase secrets set LIVEKIT_API_KEY=your-actual-api-key
supabase secrets set LIVEKIT_API_SECRET=your-actual-api-secret
```

---

## STEP 8 — VERIFY .env HAS LIVEKIT URL

Confirm this line exists in .env:
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

Replace with your actual LiveKit Cloud WSS URL from the
LiveKit dashboard → your project → WebSocket URL.

---

## IMPORTANT CONSTRAINTS

- Do NOT add E2EE key management in Phase 1. Basic call works first.
  E2EE key distribution can be added as a follow-up.
- Do NOT use any Firebase imports. Supabase only.
- Token MUST come from the Supabase Edge Function — never generate
  tokens client-side.
- The LIVEKIT_API_KEY and LIVEKIT_API_SECRET must NEVER appear in
  the app or be prefixed with EXPO_PUBLIC_.
- Use lucide-react-native for all icons (already installed).
- Use Colors from src/constants/theme.ts for all color values.
- Use SafeAreaView from react-native-safe-area-context on the call screen.
- VideoView must be imported from @livekit/react-native.
- After all files are created, run: npx expo start --clear