import Avatar from "@/src/components/ui/Avatar";
import Button from "@/src/components/ui/Button";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import {
  getCircle,
  getLatestCircleForParticipant,
  subscribeToCircle,
} from "@/src/services/circle";
import { getUsersByIds, SwipeCandidate } from "@/src/services/swipe";
import { Circle } from "@/src/types";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DimensionValue } from "react-native";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const arrangeMembers = (
  memberIds: string[],
  profiles: SwipeCandidate[],
): SwipeCandidate[] => {
  const byId = new Map(profiles.map((profile) => [profile.uid, profile]));
  return memberIds
    .map((memberId) => byId.get(memberId))
    .filter((profile): profile is SwipeCandidate => Boolean(profile));
};

export default function CircleProgressScreen() {
  const { user } = useAuth();
  const { refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const subscribedCircleId = circle?.id;
  const previousStatusRef = useRef<Circle["status"] | null>(null);

  const loadCircle = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const targetCircle = params.circleId
      ? await getCircle(String(params.circleId))
      : await getLatestCircleForParticipant(user.id);

    setCircle(targetCircle);
    setLoading(false);
  }, [params.circleId, user]);

  useEffect(() => {
    loadCircle();
  }, [loadCircle]);

  useFocusEffect(
    useCallback(() => {
      loadCircle();
    }, [loadCircle]),
  );

  useEffect(() => {
    let active = true;

    const loadMembers = async () => {
      if (!circle) {
        setMembers([]);
        return;
      }

      const profiles = await getUsersByIds(circle.members);
      if (active) {
        setMembers(arrangeMembers(circle.members, profiles));
      }
    };

    loadMembers();

    return () => {
      active = false;
    };
  }, [circle]);

  useEffect(() => {
    if (!subscribedCircleId) return;

    const channel = subscribeToCircle(subscribedCircleId, async () => {
      const updatedCircle = await getCircle(subscribedCircleId);
      if (updatedCircle) {
        setCircle(updatedCircle);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [subscribedCircleId]);

  useEffect(() => {
    if (!circle) return;


    const wasForming = previousStatusRef.current === "forming";
    const becameComplete = wasForming && circle.status === "complete";
    const fullWhileForming =
      circle.status === "forming" && circle.members.length >= circle.size;

    previousStatusRef.current = circle.status;

    if (becameComplete || fullWhileForming) {
      void refreshSwipeTabVisibility({ silent: true });
      router.replace("/(tabs)/home?circleView=complete");
    }
  }, [circle, refreshSwipeTabVisibility]);

  const membersCount = circle?.members.length ?? 0;
  const size = circle?.size ?? 0;
  const spotsRemaining = Math.max(0, size - membersCount);
  const isReadOnlyComplete = Boolean(
    circle && (circle.status === "complete" || membersCount >= size),
  );
  const isHost = Boolean(circle && user && circle.creatorId === user.id);
  const showContinueSwiping = isHost && !isReadOnlyComplete;
  const progressWidth = useMemo<DimensionValue>(() => {
    if (!size) return "0%";
    return `${Math.min(100, (membersCount / size) * 100)}%`;
  }, [membersCount, size]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <Text style={styles.title}>No active Circle</Text>
          <Text style={styles.subtitle}>Create or join a Circle to get started.</Text>
          <View style={styles.footerButton}>
            <Button title="Find a Circle" onPress={() => router.replace("/(tabs)/home")} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View>
          <Text style={styles.title}>{circle.name}</Text>
          <Text style={styles.subtitle}>Your circle is forming</Text>
        </View>

        <View style={styles.membersRow}>
          {Array.from({ length: circle.size }).map((_, index) => {
            const member = members[index];

            return (
              <View key={member?.uid ?? `open-${index}`} style={styles.memberItem}>
                <Avatar
                  size={54}
                  uri={member?.photoURL || undefined}
                  placeholder={!member?.photoURL}
                />
                <Text numberOfLines={1} style={styles.memberName}>
                  {member?.name?.split(" ")[0] || "Open"}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Circle progress</Text>
            <Text style={styles.progressCount}>
              {membersCount} / {circle.size}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            {isReadOnlyComplete
              ? "All members accepted. Your Circle is complete."
              : `Waiting for ${spotsRemaining} more to accept your invite`}
          </Text>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>MEETUP GOAL</Text>
          <Text style={styles.goalTitle}>{circle.meetupGoal || "Coffee meetup"}</Text>
          <Text style={styles.goalTimeframe}>
            {circle.meetupTimeframe || "Within 3 days"}
          </Text>
        </View>
      </View>

      {(showContinueSwiping || isReadOnlyComplete) && (
        <View style={styles.footer}>
          <Button
            title={isReadOnlyComplete ? "Back to Circle" : "Continue swiping"}
            onPress={() =>
              isReadOnlyComplete
                ? router.push("/(tabs)/home?circleView=complete")
                : router.push("/(tabs)/swipe")
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  membersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  memberItem: {
    alignItems: "center",
    width: 64,
    gap: Spacing.xs,
  },
  memberName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    maxWidth: 64,
  },
  progressCard: {
    backgroundColor: "#FFF8EA",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    ...Typography.h3,
  },
  progressCount: {
    ...Typography.h3,
    color: Colors.primaryDark,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  progressText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  goalCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  goalLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  goalTitle: {
    ...Typography.h3,
    marginTop: Spacing.sm,
  },
  goalTimeframe: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  footer: {
    paddingTop: Spacing.md,
  },
  footerButton: {
    width: "100%",
    marginTop: Spacing.lg,
  },
});
