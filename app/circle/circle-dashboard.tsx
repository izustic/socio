import Avatar from "@/src/components/ui/Avatar";
import Button from "@/src/components/ui/Button";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  getCircle,
  getLatestCircleForParticipant,
} from "@/src/services/circle";
import { getUsersByIds, SwipeCandidate } from "@/src/services/swipe";
import { Circle } from "@/src/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  DimensionValue,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CircleDashboardScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<(Circle & { id: string }) | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const targetCircle = params.circleId
          ? await getCircle(String(params.circleId))
          : await getLatestCircleForParticipant(user.id);
        setCircle(targetCircle);
        if (targetCircle) {
          const memberProfiles = await getUsersByIds(
            targetCircle.members || [],
          );
          setMembers(memberProfiles);
        } else {
          setMembers([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, params.circleId]);

  const progressText = useMemo(() => {
    if (!circle) return "0 of 0 members";
    return `${(circle.members || []).length} of ${circle.size} members`;
  }, [circle]);

  const progressWidth = useMemo<DimensionValue>(() => {
    if (!circle || !circle.size) return "0%";
    const ratio = Math.min(1, (circle.members || []).length / circle.size);
    return `${ratio * 100}%`;
  }, [circle]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <Text style={styles.title}>My Circle</Text>
          <Text style={styles.subtitle}>
            You have not created a circle yet.
          </Text>
          <View style={styles.ctaWrap}>
            <Button
              title="Create Circle"
              onPress={() => router.replace("/circle/create")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const membersNeeded = Math.max(
    0,
    circle.size - (circle.members || []).length,
  );
  const isComplete = circle.status === "complete" || membersNeeded === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {isComplete && (
          <View style={styles.badgeTop}>
            <Text style={styles.badgeTopText}>COMPLETE</Text>
          </View>
        )}
        <Text style={styles.title}>{circle.name || "My Circle"}</Text>
        <Text style={styles.subtitle}>
          {isComplete
            ? "Your Circle is ready to meet"
            : "Your circle is forming"}
        </Text>

        <View style={styles.memberRow}>
          {Array.from({ length: circle.size }).map((_, index) => {
            const member = members[index];
            return (
              <View
                key={`${member?.uid || "empty"}-${index}`}
                style={styles.avatarWrap}
              >
                <Avatar
                  size="md"
                  uri={member?.photoURL || undefined}
                  placeholder={!member?.photoURL}
                  style={index > 0 && !isComplete ? undefined : undefined} // Adjusted to avoid overlap if we have names
                />
                <Text style={styles.avatarName}>
                  {member ? member.name.split(" ")[0] : "Open"}
                </Text>
              </View>
            );
          })}
        </View>

        {isComplete ? (
          <>
            <Text style={styles.membersListText}>
              You
              {members.length > 1
                ? `, ${members
                    .slice(1)
                    .map((m) => m.name.split(" ")[0])
                    .join(", ")}`
                : ""}
            </Text>
            <View style={styles.timerBlock}>
              <Text style={styles.timerLabel}>COFFEE MEETUP IN</Text>
              <View style={styles.timerNumbers}>
                <View style={styles.timerCol}>
                  <Text style={styles.timerVal}>04</Text>
                  <Text style={styles.timerUnit}>DAYS</Text>
                </View>
                <View style={styles.timerCol}>
                  <Text style={styles.timerVal}>06</Text>
                  <Text style={styles.timerUnit}>HRS</Text>
                </View>
                <View style={styles.timerCol}>
                  <Text style={styles.timerVal}>23</Text>
                  <Text style={styles.timerUnit}>MIN</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progress</Text>
                <Text style={styles.progressCount}>
                  {circle.members?.length || 0} / {circle.size}
                </Text>
              </View>
              <View style={styles.progressTrackDash}>
                <View
                  style={[styles.progressFillDash, { width: progressWidth }]}
                />
              </View>
              <Text style={styles.progressWait}>
                Waiting for {membersNeeded} more to accept your invite
              </Text>
            </View>

            <View style={styles.goalBlock}>
              <Text style={styles.goalLabel}>MEETUP GOAL</Text>
              <Text
                style={styles.goalValue}
              >{`${circle.meetupGoal || "Coffee"} • ${circle.meetupTimeframe || "Within 3 days"}`}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        {isComplete ? (
          <>
            <Button
              title="Enter Circle"
              onPress={() => router.push("/circle/chat")}
            />
            <TouchableOpacity onPress={() => router.push("/circle/progress")}>
              <Text style={styles.viewDetailsText}>View details</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Button
            title="Continue swiping"
            onPress={() => router.push("/(tabs)/swipe")}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    alignItems: "center",
  },
  badgeTop: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
  },
  badgeTopText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  title: {
    ...Typography.h1,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  avatarWrap: {
    alignItems: "center",
    gap: 6,
  },
  avatarName: {
    ...Typography.bodySmall,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  membersListText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  timerBlock: {
    backgroundColor: "#FFF8EA",
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  timerLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  timerNumbers: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  timerCol: {
    alignItems: "center",
  },
  timerVal: {
    ...Typography.display,
  },
  timerUnit: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressBlock: {
    backgroundColor: "#FFF8EA",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  progressCount: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  progressTrackDash: {
    height: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressFillDash: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  progressWait: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  goalBlock: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: "100%",
  },
  goalLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  goalValue: {
    ...Typography.body,
    fontWeight: "700",
  },
  viewDetailsText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  ctaWrap: {
    width: "100%",
    marginTop: Spacing.lg,
  },
});
