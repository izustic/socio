import Avatar from "@/src/components/ui/Avatar";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import {
  closeCircle,
  getCircle,
  getLatestCircleForParticipant,
  removeMember,
} from "@/src/services/circle";
import { getUsersByIds, SwipeCandidate } from "@/src/services/swipe";
import { Circle } from "@/src/types";
import {
  getCircleMeetupDeadline,
  getCountdownParts,
  hasMeetupDeadlineElapsed,
} from "@/src/utils/circleDeadline";
import { router, useLocalSearchParams } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  Crown,
  LogOut,
  MapPin,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
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

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const getCircleTags = (circle: Circle) => {
  const tags = [
    circle.filters.vibe,
    circle.meetupGoal,
    ...(circle.filters.interests ?? []),
  ].filter((tag): tag is string => Boolean(tag && tag.trim()));

  return Array.from(new Set(tags)).slice(0, 3);
};

export default function CircleInfoScreen() {
  const { user } = useAuth();
  const { endJoinBrowsing, refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;

    const loadInfo = async () => {
      if (!user) return;

      setLoading(true);
      const targetCircle = params.circleId
        ? await getCircle(String(params.circleId))
        : await getLatestCircleForParticipant(user.id);

      if (!active) return;
      setCircle(targetCircle);

      if (targetCircle) {
        const profiles = await getUsersByIds(targetCircle.members);
        if (!active) return;
        const byId = new Map(profiles.map((profile) => [profile.uid, profile]));
        setMembers(
          targetCircle.members
            .map((memberId) => byId.get(memberId))
            .filter((profile): profile is SwipeCandidate => Boolean(profile)),
        );
      } else {
        setMembers([]);
      }

      setLoading(false);
    };

    void loadInfo();

    return () => {
      active = false;
    };
  }, [params.circleId, user]);

  useEffect(() => {
    if (!circle) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [circle]);

  const host = useMemo(
    () => members.find((member) => member.uid === circle?.creatorId) ?? null,
    [circle?.creatorId, members],
  );
  const tags = circle ? getCircleTags(circle) : [];
  const locationText = host?.location?.city
    ? host.location.city
    : host?.location
      ? "Host location shared"
      : "Location not shared";
  const meetupDeadline = circle ? getCircleMeetupDeadline(circle) : null;
  const countdown = meetupDeadline ? getCountdownParts(meetupDeadline, now) : null;
  const deadlineElapsed = Boolean(
    circle && hasMeetupDeadlineElapsed(circle, now),
  );
  const canLeave = Boolean(
    circle && user && circle.creatorId !== user.id && deadlineElapsed,
  );
  const canClose = Boolean(
    circle && user && circle.creatorId === user.id && deadlineElapsed,
  );

  const confirmLeaveCircle = () => {
    if (!circle || !user || leaving) return;

    if (!canLeave) return;

    Alert.alert(
      "Leave Circle?",
      `You will leave ${circle.name} and lose access to its chat.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setLeaving(true);
            try {
              await removeMember(circle.id, user.id);
              endJoinBrowsing();
              await refreshSwipeTabVisibility({ silent: true });
              router.replace("/(tabs)/home");
            } catch (error) {
              console.error("Error leaving circle:", error);
              Alert.alert("Could not leave Circle", "Please try again.");
            } finally {
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  const confirmCloseCircle = () => {
    if (!circle || !user || closing || !canClose) return;

    Alert.alert(
      "Close Circle?",
      `This will delete ${circle.name} and remove everyone from the Circle. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Circle",
          style: "destructive",
          onPress: async () => {
            setClosing(true);
            try {
              await closeCircle(circle.id);
              endJoinBrowsing();
              await refreshSwipeTabVisibility({ silent: true });
              router.replace("/(tabs)/home");
            } catch (error) {
              console.error("Error closing circle:", error);
              Alert.alert("Could not close Circle", "Please try again.");
            } finally {
              setClosing(false);
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
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.76}
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Circle info</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Circle unavailable</Text>
          <Text style={styles.emptyText}>This Circle could not be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.76}
          style={styles.iconButton}
          onPress={() => router.back()}
          accessibilityLabel="Back to chat"
        >
          <ChevronLeft size={24} color={Colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Circle info</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarRow}>
          {members.slice(0, 3).map((member, index) => (
            <Avatar
              key={member.uid}
              uri={member.photoURL}
              size={68}
              style={[
                styles.heroAvatar,
                index > 0 && styles.heroAvatarOverlap,
              ]}
            />
          ))}
        </View>

        <Text style={styles.circleName}>{circle.name}</Text>
        <Text style={styles.circleSummary}>
          {circle.meetupTimeframe
            ? `${circle.meetupGoal || "A Circle"} · ${circle.meetupTimeframe}`
            : circle.meetupGoal || "A Circle for meeting in person."}
        </Text>

        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoPanel}>
          <View style={styles.infoRow}>
            <MapPin size={18} color={Colors.textSecondary} strokeWidth={2.1} />
            <Text style={styles.infoText}>{locationText}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Calendar size={18} color={Colors.textSecondary} strokeWidth={2.1} />
            <Text style={styles.infoText}>
              Formed {formatDate(circle.createdAt)} · {circle.members.length} of{" "}
              {circle.size} members
            </Text>
          </View>
          {meetupDeadline && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Calendar size={18} color={Colors.textSecondary} strokeWidth={2.1} />
                <Text style={styles.infoText}>
                  Meet by {formatDate(meetupDeadline)}
                  {!deadlineElapsed && countdown
                    ? ` · ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
                    : " · window ended"}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Members</Text>
          <Text style={styles.sectionCount}>{circle.members.length}</Text>
        </View>

        <View style={styles.memberList}>
          {members.map((member) => {
            const isHost = member.uid === circle.creatorId;
            return (
              <View key={member.uid} style={styles.memberRow}>
                <Avatar uri={member.photoURL} size={44} />
                <View style={styles.memberCopy}>
                  <Text numberOfLines={1} style={styles.memberName}>
                    {member.name || "Member"}
                  </Text>
                  <Text style={styles.memberRole}>
                    {isHost ? "Host" : "Member"}
                  </Text>
                </View>
                {isHost && (
                  <View style={styles.hostBadge}>
                    <Crown
                      size={13}
                      color={Colors.textPrimary}
                      strokeWidth={2.2}
                    />
                    <Text style={styles.hostBadgeText}>Host</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {canLeave && (
          <TouchableOpacity
            activeOpacity={0.76}
            style={[styles.leaveButton, leaving && styles.leaveButtonDisabled]}
            onPress={confirmLeaveCircle}
            disabled={leaving}
          >
            {leaving ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <>
                <LogOut size={18} color={Colors.danger} strokeWidth={2.1} />
                <Text style={styles.leaveText}>Leave Circle</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {canClose && (
          <TouchableOpacity
            activeOpacity={0.76}
            style={[styles.leaveButton, closing && styles.leaveButtonDisabled]}
            onPress={confirmCloseCircle}
            disabled={closing}
          >
            {closing ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <>
                <Trash2 size={18} color={Colors.danger} strokeWidth={2.1} />
                <Text style={styles.leaveText}>Close Circle</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {!deadlineElapsed && countdown && (
          <Text style={styles.leaveUnavailableText}>
            {circle.creatorId === user?.id ? "Close" : "Leave"} unlocks after the meetup window ends.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.screenPadding,
  },
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.body,
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
    alignItems: "center",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroAvatar: {
    borderWidth: 3,
    borderColor: Colors.white,
  },
  heroAvatarOverlap: {
    marginLeft: -18,
  },
  circleName: {
    ...Typography.h2,
    textAlign: "center",
    color: Colors.textPrimary,
  },
  circleSummary: {
    ...Typography.body,
    maxWidth: 300,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tag: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tagText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  infoPanel: {
    width: "100%",
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
  },
  infoRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  infoText: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    marginLeft: 48,
    backgroundColor: Colors.divider,
  },
  sectionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    color: Colors.textSecondary,
  },
  sectionCount: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  memberList: {
    width: "100%",
    gap: Spacing.sm,
  },
  memberRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  memberCopy: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  memberRole: {
    ...Typography.bodySmall,
    marginTop: 1,
    color: Colors.textSecondary,
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hostBadgeText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  leaveButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  leaveButtonDisabled: {
    opacity: 0.7,
  },
  leaveText: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.danger,
  },
  leaveUnavailableText: {
    ...Typography.bodySmall,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
