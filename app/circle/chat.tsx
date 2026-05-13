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
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ChatScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<(Circle & { id: string }) | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const targetCircle = params.circleId
        ? await getCircle(String(params.circleId))
        : await getLatestCircleForParticipant(user.id);
      setCircle(targetCircle);
      if (targetCircle) {
        const memberProfiles = await getUsersByIds(targetCircle.members || []);
        setMembers(memberProfiles);
      } else {
        setMembers([]);
      }
      setLoading(false);
    };
    load();
  }, [user?.id, params.circleId]);

  const membersCount = (circle?.members || []).length;
  const size = circle?.size || 0;
  const progressWidth = useMemo((): any => {
    if (!size) return "0%";
    return `${Math.min(1, membersCount / size) * 100}%`;
  }, [membersCount, size]);
  const isComplete = Boolean(
    circle && (circle.status === "complete" || membersCount >= size),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <Text style={styles.title}>Your Circle</Text>
          <Text style={styles.subtitle}>No active circle yet.</Text>
          <View style={styles.ctaWrap}>
            <Button
              title="Create Circle"
              onPress={() => router.push("/circle/create")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerRow}>
        <Text style={styles.title}>{circle.name}</Text>
        <View
          style={[styles.stageBadge, isComplete && styles.stageBadgeComplete]}
        >
          <Text style={styles.stageBadgeText}>
            {isComplete ? "COMPLETE" : "FORMING"}
          </Text>
        </View>
      </View>
      <Text style={styles.subtitle}>
        {isComplete ? "Your Circle is ready to meet" : "Your circle is forming"}
      </Text>

      <View style={styles.membersRow}>
        {Array.from({ length: size }).map((_, index) => {
          const member = members[index];
          return (
            <View
              key={`${member?.uid || `empty-${index}`}`}
              style={styles.memberItem}
            >
              <Avatar
                size="md"
                uri={member?.photoURL || undefined}
                placeholder={!member?.photoURL}
              />
              <Text style={styles.memberName}>{member?.name || "Open"}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressCount}>
            {membersCount} / {size}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressText}>
          {isComplete
            ? "All members accepted. Your Circle is complete."
            : `Waiting for ${Math.max(0, size - membersCount)} more to accept your invite`}
        </Text>
      </View>

      <View style={styles.goalCard}>
        <Text style={styles.goalLabel}>MEETUP GOAL</Text>
        <Text
          style={styles.goalValue}
        >{`${(circle as any).meetupGoal || "Coffee"} · ${(circle as any).meetupTimeframe || "Within 3 days"}`}</Text>
      </View>

      <View style={styles.footer}>
        {isComplete ? (
          <>
            <Button
              title="Enter Circle"
              onPress={() => router.push("/circle/call")}
            />
            <Button
              title="View details"
              variant="ghost"
              onPress={() => router.push("/circle/progress")}
            />
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
    padding: Spacing.screenPadding,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaWrap: {
    marginTop: Spacing.lg,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...Typography.h2,
  },
  stageBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stageBadgeComplete: {
    backgroundColor: Colors.primary,
  },
  stageBadgeText: {
    ...Typography.bodySmall,
    fontWeight: "700",
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  membersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  memberItem: {
    alignItems: "center",
    width: 58,
  },
  memberName: {
    ...Typography.bodySmall,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: "#F7F1DD",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    ...Typography.h3,
  },
  progressCount: {
    ...Typography.h3,
  },
  progressTrack: {
    marginTop: Spacing.sm,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  progressText: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  goalCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  goalLabel: {
    ...Typography.label,
  },
  goalValue: {
    ...Typography.h3,
    marginTop: Spacing.xs,
  },
  footer: {
    marginTop: "auto",
    gap: Spacing.sm,
  },
});
