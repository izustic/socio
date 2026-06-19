import Avatar from "@/src/components/ui/Avatar";
import Button from "@/src/components/ui/Button";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { getCircle, getLatestCircleForParticipant } from "@/src/services/circle";
import { getUsersByIds, SwipeCandidate } from "@/src/services/swipe";
import { Circle } from "@/src/types";
import { getCircleMeetupDeadline, getCountdownParts } from "@/src/utils/circleDeadline";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

export default function CircleCompleteScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;

    const loadCircle = async () => {
      if (!user) return;

      setLoading(true);
      const targetCircle = params.circleId
        ? await getCircle(String(params.circleId))
        : await getLatestCircleForParticipant(user.id);

      if (!active) return;
      setCircle(targetCircle);
      setLoading(false);
    };

    loadCircle();

    return () => {
      active = false;
    };
  }, [params.circleId, user]);

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
    if (!circle) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [circle]);

  const memberNames = useMemo(() => {
    if (!user) return members.map((m) => m.name.split(" ")[0]).join(", ");

    return members
      .map((m) => (m.uid === user.id ? "You" : m.name.split(" ")[0]))
      .join(", ");
  }, [members, user]);

  const meetupDeadline = useMemo(
    () => (circle ? getCircleMeetupDeadline(circle) : null),
    [circle],
  );
  const countdown = useMemo(
    () =>
      meetupDeadline
        ? getCountdownParts(meetupDeadline, now)
        : { days: "00", hours: "00", minutes: "00", seconds: "00" },
    [meetupDeadline, now],
  );

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

  // No !circle guard here — CircleTabScreen (home.tsx) ensures this screen
  // is only ever rendered when a valid circle exists.

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>COMPLETE</Text>
        </View>

        <View>
          <Text style={styles.title}>{circle!.name}</Text>
          <Text style={styles.subtitle}>Your Circle is ready to meet</Text>
        </View>

        <View style={styles.membersRow}>
          {members.map((member) => (
            <View key={member.uid} style={styles.memberItem}>
              <Avatar
                size={54}
                uri={member.photoURL || undefined}
                placeholder={!member.photoURL}
              />
              <Text numberOfLines={1} style={styles.memberName}>
                {member.uid === user?.id ? "You" : member.name.split(" ")[0]}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.memberLine}>{memberNames}</Text>

        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>
            {(circle!.meetupGoal || "Circle meetup").toUpperCase()} IN
          </Text>
          <View style={styles.countdownColumns}>
            <View style={styles.countdownColumn}>
              <Text style={styles.countdownValue}>{countdown.days}</Text>
              <Text style={styles.countdownUnit}>DAYS</Text>
            </View>
            <View style={styles.countdownColumn}>
              <Text style={styles.countdownValue}>{countdown.hours}</Text>
              <Text style={styles.countdownUnit}>HRS</Text>
            </View>
            <View style={styles.countdownColumn}>
              <Text style={styles.countdownValue}>{countdown.minutes}</Text>
              <Text style={styles.countdownUnit}>MIN</Text>
            </View>
            <View style={styles.countdownColumn}>
              <Text style={styles.countdownValue}>{countdown.seconds}</Text>
              <Text style={styles.countdownUnit}>SEC</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Enter Circle"
          onPress={() => router.push("/(tabs)/home?circleView=chat")}
        />
        <Button
          title="View details"
          variant="ghost"
          onPress={() => router.push("/(tabs)/home?circleView=progress")}
        />
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
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.lg,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  badgeText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  title: {
    ...Typography.h2,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  membersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
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
  memberLine: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  countdownCard: {
    width: "100%",
    backgroundColor: "#FFF8EA",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  countdownLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "800",
  },
  countdownColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  countdownColumn: {
    flex: 1,
    alignItems: "center",
  },
  countdownValue: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  countdownUnit: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  footer: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
});
