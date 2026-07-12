import { createThemedStyles, Colors, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { CallParticipant, useCircleCall } from "@/src/hooks/useCircleCall";
import { router, useLocalSearchParams } from "expo-router";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react-native";
import React, { useEffect } from "react";
import { VideoView } from "@livekit/react-native";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tx } from "@/src/utils/localization";

export default function CallScreen() {
  const { user, profile } = useAuth();
  const params = useLocalSearchParams<{
    circleId?: string;
    circleName?: string;
  }>();

  const circleId = params.circleId ?? "";
  const userId = user?.id ?? "";
  const userName = profile?.name ?? user?.email?.split("@")[0] ?? tx("circleInfo.member");

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
  } = useCircleCall(circleId, userName);

  // Auto-connect on mount
  useEffect(() => {
    if (circleId && userId) {
      connect();
    }
  }, [circleId, userId, connect]);

  // Show error and go back
  useEffect(() => {
    if (error) {
      Alert.alert(tx("app.circle.call.callFailed"), error, [
        { text: tx("app.circle.call.ok"), onPress: () => router.back() },
      ]);
    }
  }, [error]);

  const handleEndCall = async () => {
    await disconnect();
    router.back();
  };

  if (!circleId) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.connectingText}>{tx("app.circle.call.noCircleSelectedForThisCall")}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.returnButton}
          activeOpacity={0.76}
        >
          <Text style={styles.returnButtonText}>{tx("app.circle.call.backToChat")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Participant tile component
  const ParticipantTile = ({
    participant,
  }: {
    participant: CallParticipant;
  }) => (
    <View style={styles.participantTile}>
      {participant.isCameraEnabled && participant.videoTrack ? (
        <VideoView
          style={styles.videoView}
          videoTrack={participant.videoTrack}
          objectFit="cover"
          mirror={participant.isLocal}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {(participant.name ?? "M")[0].toUpperCase()}
          </Text>
        </View>
      )}

      {/* Name + mute indicator */}
      <View style={styles.participantLabel}>
        {!participant.isMicEnabled && (
          <MicOff size={12} color={Colors.white} strokeWidth={2} />
        )}
        <Text numberOfLines={1} style={styles.participantName}>
          {participant.isLocal ? tx("app.circle.call.you") : participant.name}
        </Text>
      </View>
    </View>
  );

  // Loading state
  if (isConnecting || (!isConnected && !error)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.connectingText}>{tx("app.circle.call.joiningCall")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.encryptedBadge}>
          <Text style={styles.encryptedText}>{tx("app.circle.call.sociolCall")}</Text>
        </View>
        <Text style={styles.memberCount}>
          {participants.length}{" "}
          {participants.length === 1 ? tx("app.circle.call.member") : tx("app.circle.call.members")}
        </Text>
      </View>

      {/* Participant grid */}
      <View style={styles.grid}>
        {participants.length === 0 ? (
          <View style={styles.emptyCall}>
            <Text style={styles.emptyCallText}>
              {tx("app.circle.call.waitingForOthersToJoin")}</Text>
          </View>
        ) : (
          <View
            style={[
              styles.participantGrid,
              participants.length <= 2 && styles.gridSingle,
              participants.length >= 3 && styles.gridQuad,
            ]}
          >
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
          style={[
            styles.controlButton,
            !isMicEnabled && styles.controlButtonOff,
          ]}
          activeOpacity={0.76}
          accessibilityLabel={
            isMicEnabled ? tx("app.circle.call.muteMicrophone") : tx("app.circle.call.unmuteMicrophone")
          }
        >
          {isMicEnabled ? (
            <Mic size={24} color={Colors.textPrimary} strokeWidth={2} />
          ) : (
            <MicOff size={24} color={Colors.white} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {/* Camera toggle */}
        <TouchableOpacity
          onPress={toggleCamera}
          style={[
            styles.controlButton,
            !isCameraEnabled && styles.controlButtonOff,
          ]}
          activeOpacity={0.76}
          accessibilityLabel={
            isCameraEnabled ? tx("app.circle.call.turnOffCamera") : tx("app.circle.call.turnOnCamera")
          }
        >
          {isCameraEnabled ? (
            <Video size={24} color={Colors.textPrimary} strokeWidth={2} />
          ) : (
            <VideoOff size={24} color={Colors.white} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {/* End call */}
        <TouchableOpacity
          onPress={handleEndCall}
          style={styles.endCallButton}
          activeOpacity={0.76}
          accessibilityLabel={tx("app.circle.call.endCall")}
        >
          <PhoneOff size={26} color={Colors.white} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  connectingText: {
    ...Typography.body,
    color: Colors.textDisabled,
  },
  returnButton: {
    marginTop: Spacing.sm,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  returnButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  encryptedBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  encryptedText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primaryLight,
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  gridSingle: {
    flexDirection: "column",
  },
  gridQuad: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  participantTile: {
    flex: 1,
    minWidth: "45%",
    minHeight: 180,
    backgroundColor: "#2A2A2A",
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  videoView: {
    ...StyleSheet.absoluteFillObject,
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#3A3A3A",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlaceholderText: {
    ...Typography.body,
    color: Colors.textDisabled,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#3A3A3A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
  },
  participantLabel: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  participantName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
    maxWidth: 100,
  },
  emptyCall: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCallText: {
    ...Typography.body,
    color: Colors.textDisabled,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonOff: {
    backgroundColor: "#FF3B30",
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 100,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
}));
