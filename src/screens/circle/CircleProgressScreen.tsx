import Avatar from "@/src/components/ui/Avatar";
import Button from "@/src/components/ui/Button";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import {
  closeCircle,
  getCircle,
  getLatestCircleForParticipant,
  leaveCircle,
  resetCircleFreeExitsIfExpired,
  subscribeToCircle,
} from "@/src/services/circle";
import { getUsersByIds, SwipeCandidate } from "@/src/services/swipe";
import { Circle } from "@/src/types";
import { getCircleExitState } from "@/src/utils/circleExit";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DimensionValue } from "react-native";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tx } from "@/src/utils/localization";

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
  const { user, profile, refreshProfile } = useAuth();
  const { endJoinBrowsing, refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [now, setNow] = useState(Date.now());
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

  useEffect(() => {
    if (!circle) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [circle]);

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
  const exitState = useMemo(
    () =>
      circle && user
        ? getCircleExitState(circle, user.id, profile?.freeExits, now)
        : null,
    [circle, now, profile?.freeExits, user],
  );
  const progressWidth = useMemo<DimensionValue>(() => {
    if (!size) return "0%";
    return `${Math.min(100, (membersCount / size) * 100)}%`;
  }, [membersCount, size]);

  useEffect(() => {
    if (!circle || !exitState?.deadlineElapsed) return;

    void resetCircleFreeExitsIfExpired(circle.id).then((didReset) => {
      if (didReset) void refreshProfile();
    });
  }, [circle, exitState?.deadlineElapsed, refreshProfile]);

  const confirmExitCircle = () => {
    if (!circle || !user || !exitState || exitState.locked || exiting) return;

    Alert.alert(
      exitState.isHost ? tx("circle.CircleProgressScreen.closeCircle") : tx("circle.CircleProgressScreen.leaveCircle"),
      exitState.isHost
        ? tx("circle.CircleProgressScreen.value1ThisWillDeleteValue2AndRemoveEveryoneFrom", { value1: exitState.helperText, value2: circle.name })
        : tx("circle.CircleProgressScreen.value1YouWillLeaveValue2", { value1: exitState.helperText, value2: circle.name }),
      [
        { text: tx("circle.CircleProgressScreen.cancel"), style: "cancel" },
        {
          text: exitState.isHost ? tx("circle.CircleProgressScreen.closeCircle2") : tx("circle.CircleProgressScreen.leave"),
          style: "destructive",
          onPress: async () => {
            setExiting(true);
            try {
              if (exitState.isHost) {
                await closeCircle(circle.id);
              } else {
                await leaveCircle(circle.id);
              }
              await refreshProfile();
              endJoinBrowsing();
              await refreshSwipeTabVisibility({ silent: true });
              router.replace("/(tabs)/home");
            } catch (error) {
              console.error("Error exiting circle:", error);
              Alert.alert(tx("circle.CircleProgressScreen.couldNotUpdateCircle"), tx("circle.CircleProgressScreen.pleaseTryAgain"));
            } finally {
              setExiting(false);
            }
          },
        },
      ],
    );
  };

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
          <Text style={styles.title}>{tx("circle.CircleProgressScreen.noActiveCircle")}</Text>
          <Text style={styles.subtitle}>{tx("circle.CircleProgressScreen.createOrJoinACircleToGetStarted")}</Text>
          <View style={styles.footerButton}>
            <Button title={tx("circle.CircleProgressScreen.findACircle")} onPress={() => router.replace("/(tabs)/home")} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.title}>{circle.name}</Text>
          <Text style={styles.subtitle}>{tx("circle.CircleProgressScreen.yourCircleIsForming")}</Text>
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
                  {member?.name?.split(" ")[0] || tx("circle.CircleProgressScreen.open")}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{tx("circle.CircleProgressScreen.circleProgress")}</Text>
            <Text style={styles.progressCount}>
              {membersCount} / {circle.size}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            {isReadOnlyComplete
              ? tx("circle.CircleProgressScreen.allMembersAcceptedYourCircleIsComplete")
              : tx("circle.CircleProgressScreen.waitingForValue1MoreToAcceptYourInvite", { value1: spotsRemaining })}
          </Text>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>{tx("circle.CircleProgressScreen.meetupGoal")}</Text>
          <Text style={styles.goalTitle}>{circle.meetupGoal || tx("circle.CircleProgressScreen.coffeeMeetup")}</Text>
          <Text style={styles.goalTimeframe}>
            {circle.meetupTimeframe || tx("circle.CircleProgressScreen.within3Days")}
          </Text>
        </View>
      </ScrollView>

      {(showContinueSwiping || isReadOnlyComplete || exitState) && (
        <View style={styles.footer}>
          {(showContinueSwiping || isReadOnlyComplete) && (
            <Button
              title={isReadOnlyComplete ? tx("circle.CircleProgressScreen.backToCircle") : tx("circle.CircleProgressScreen.continueSwiping")}
              onPress={() =>
                isReadOnlyComplete
                  ? router.push("/(tabs)/home?circleView=complete")
                  : router.push("/(tabs)/swipe")
              }
            />
          )}
          {exitState && (
            <TouchableOpacity
              activeOpacity={0.76}
              style={[
                styles.exitButton,
                exitState.locked && styles.exitButtonDisabled,
              ]}
              disabled={exitState.locked || exiting}
              onPress={confirmExitCircle}
            >
              <Text style={styles.exitButtonText}>
                {exiting ? tx("circle.CircleProgressScreen.working") : exitState.label}
              </Text>
              <Text style={styles.exitHelper}>{exitState.helperText}</Text>
            </TouchableOpacity>
          )}
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
  },
  scrollContent: {
    gap: Spacing.lg,
    paddingBottom: Spacing.lg,
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
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  exitButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  exitButtonDisabled: {
    opacity: 0.55,
  },
  exitButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  exitHelper: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  footerButton: {
    width: "100%",
    marginTop: Spacing.lg,
  },
});
