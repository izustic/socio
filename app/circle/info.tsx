import Avatar from "@/src/components/ui/Avatar";
import { createThemedStyles, Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import {
  closeCircle,
  getCircle,
  getLatestCircleForParticipant,
  leaveCircle,
  resetCircleFreeExitsIfExpired,
} from "@/src/services/circle";
import { reportUser } from "@/src/services/moderation";
import { getUsersByIds, SwipeCandidate } from "@/src/services/swipe";
import { Circle } from "@/src/types";
import {
  getCircleMeetupDeadline,
  getCountdownParts,
  hasMeetupDeadlineElapsed,
} from "@/src/utils/circleDeadline";
import { getCircleExitState } from "@/src/utils/circleExit";
import { router, useLocalSearchParams } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  Crown,
  Flag,
  LogOut,
  MapPin,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatLocalizedDate, optionLabel, tx } from "@/src/utils/localization";

const formatDate = (date: Date) =>
  formatLocalizedDate(date, {
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

const REPORT_REASONS = [
  "Harassment",
  "Unsafe behavior",
  "Fake profile",
  "Spam",
  "Inappropriate content",
  "Other",
];

export default function CircleInfoScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { endJoinBrowsing, refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [reportTarget, setReportTarget] = useState<SwipeCandidate | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

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
      ? tx("circleInfo.hostLocationShared")
      : tx("circleInfo.locationNotShared");
  const meetupDeadline = circle ? getCircleMeetupDeadline(circle) : null;
  const countdown = meetupDeadline ? getCountdownParts(meetupDeadline, now) : null;
  const deadlineElapsed = Boolean(
    circle && hasMeetupDeadlineElapsed(circle, now),
  );
  const exitState = useMemo(
    () =>
      circle && user
        ? getCircleExitState(circle, user.id, profile?.freeExits, now)
        : null,
    [circle, now, profile?.freeExits, user],
  );

  useEffect(() => {
    if (!circle || !exitState?.deadlineElapsed) return;

    void resetCircleFreeExitsIfExpired(circle.id).then((didReset) => {
      if (didReset) void refreshProfile();
    });
  }, [circle, exitState?.deadlineElapsed, refreshProfile]);

  const confirmLeaveCircle = () => {
    if (!circle || !user || leaving || !exitState || exitState.locked) return;

    Alert.alert(
      tx("app.circle.info.leaveCircle"),
      tx("app.circle.info.value1YouWillLeaveValue2AndLoseAccessTo", { value1: exitState.helperText, value2: circle.name }),
      [
        { text: tx("app.circle.info.cancel"), style: "cancel" },
        {
          text: tx("app.circle.info.leave"),
          style: "destructive",
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveCircle(circle.id);
              await refreshProfile();
              endJoinBrowsing();
              await refreshSwipeTabVisibility({ silent: true });
              router.replace("/(tabs)/home");
            } catch (error) {
              console.error("Error leaving circle:", error);
              Alert.alert(tx("app.circle.info.couldNotLeaveCircle"), tx("app.circle.info.pleaseTryAgain"));
            } finally {
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  const confirmCloseCircle = () => {
    if (!circle || !user || closing || !exitState || exitState.locked) return;

    Alert.alert(
      tx("app.circle.info.closeCircle"),
      tx("app.circle.info.value1ThisWillDeleteValue2AndRemoveEveryoneFrom", { value1: exitState.helperText, value2: circle.name }),
      [
        { text: tx("app.circle.info.cancel"), style: "cancel" },
        {
          text: tx("app.circle.info.closeCircle2"),
          style: "destructive",
          onPress: async () => {
            setClosing(true);
            try {
              await closeCircle(circle.id);
              await refreshProfile();
              endJoinBrowsing();
              await refreshSwipeTabVisibility({ silent: true });
              router.replace("/(tabs)/home");
            } catch (error) {
              console.error("Error closing circle:", error);
              Alert.alert(tx("app.circle.info.couldNotCloseCircle"), tx("app.circle.info.pleaseTryAgain"));
            } finally {
              setClosing(false);
            }
          },
        },
      ],
    );
  };

  const openReportModal = (member: SwipeCandidate) => {
    if (!user || member.uid === user.id) return;

    setReportTarget(member);
    setReportReason(REPORT_REASONS[0]);
    setReportDetails("");
    setReportError(null);
  };

  const closeReportModal = () => {
    if (reporting) return;

    setReportTarget(null);
    setReportDetails("");
    setReportError(null);
  };

  const submitReport = async () => {
    if (!user || !circle || !reportTarget || reporting) return;

    setReporting(true);
    setReportError(null);

    try {
      await reportUser({
        reporterId: user.id,
        reportedId: reportTarget.uid,
        reason: reportReason,
        details: reportDetails,
        circleId: circle.id,
      });
      setReportSuccess(tx("circleInfo.reportSuccess", {
        name: reportTarget.name || tx("circleInfo.thisMember"),
      }));
      setReportTarget(null);
      setReportDetails("");
      setReportError(null);
    } catch (error) {
      console.error("Error reporting member:", error);
      setReportError(tx("circleInfo.reportError"));
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.76}
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tx("app.circle.info.circleInfo")}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{tx("app.circle.info.circleUnavailable")}</Text>
          <Text style={styles.emptyText}>{tx("app.circle.info.thisCircleCouldNotBeLoaded")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.76}
          style={styles.iconButton}
          onPress={() => router.back()}
          accessibilityLabel={tx("app.circle.info.backToChat")}
        >
          <ChevronLeft size={24} color={Colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tx("app.circle.info.circleInfo")}</Text>
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
            ? tx("app.circle.info.value1Value2", { value1: circle.meetupGoal || "A Circle", value2: circle.meetupTimeframe })
            : circle.meetupGoal || tx("app.circle.info.aCircleForMeetingInPerson")}
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
              {tx("circleInfo.formedMembers", {
                date: formatDate(circle.createdAt),
                current: circle.members.length,
                total: circle.size,
              })}
            </Text>
          </View>
          {meetupDeadline && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Calendar size={18} color={Colors.textSecondary} strokeWidth={2.1} />
                <Text style={styles.infoText}>
                  {tx("circleInfo.meetBy", { date: formatDate(meetupDeadline) })}
                  {!deadlineElapsed && countdown
                    ? tx("app.circle.info.value1DValue2HValue3M", { value1: countdown.days, value2: countdown.hours, value3: countdown.minutes })
                    : tx("app.circle.info.windowEnded")}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{tx("app.circle.info.members2")}</Text>
          <Text style={styles.sectionCount}>{circle.members.length}</Text>
        </View>

        <View style={styles.memberList}>
          {members.map((member) => {
            const isHost = member.uid === circle.creatorId;
            const isCurrentUser = member.uid === user?.id;
            return (
              <View key={member.uid} style={styles.memberRow}>
                <Avatar uri={member.photoURL} size={44} />
                <View style={styles.memberCopy}>
                  <Text numberOfLines={1} style={styles.memberName}>
                    {member.name || tx("app.circle.info.member")}
                  </Text>
                  <Text style={styles.memberRole}>
                    {isHost ? tx("app.circle.info.host") : tx("app.circle.info.member")}
                  </Text>
                </View>
                <View style={styles.memberActions}>
                  {isHost && (
                    <View style={styles.hostBadge}>
                      <Crown
                        size={13}
                        color={Colors.textPrimary}
                        strokeWidth={2.2}
                      />
                      <Text style={styles.hostBadgeText}>{tx("app.circle.info.host")}</Text>
                    </View>
                  )}
                  {!isCurrentUser && (
                    <TouchableOpacity
                      activeOpacity={0.76}
                      style={styles.reportMemberButton}
                      onPress={() => openReportModal(member)}
                      accessibilityLabel={tx("app.circle.info.reportValue1", { value1: member.name || tx("circleInfo.member") })}
                    >
                      <Flag
                        size={16}
                        color={Colors.textSecondary}
                        strokeWidth={2.1}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {exitState && (
          <TouchableOpacity
            activeOpacity={0.76}
            style={[
              styles.leaveButton,
              (leaving || closing || exitState.locked) &&
                styles.leaveButtonDisabled,
            ]}
            onPress={exitState.isHost ? confirmCloseCircle : confirmLeaveCircle}
            disabled={leaving || closing || exitState.locked}
          >
            {leaving || closing ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <>
                {exitState.isHost ? (
                  <Trash2 size={18} color={Colors.danger} strokeWidth={2.1} />
                ) : (
                  <LogOut size={18} color={Colors.danger} strokeWidth={2.1} />
                )}
                <Text style={styles.leaveText}>{exitState.label}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {exitState && (
          <Text style={styles.leaveUnavailableText}>
            {exitState.helperText}
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(reportTarget)}
        transparent
        animationType="slide"
        onRequestClose={closeReportModal}
      >
        <View style={styles.reportOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.reportScrim}
            onPress={closeReportModal}
          />
          <View style={styles.reportSheet}>
            <View style={styles.reportHandle} />
            <View style={styles.reportHeader}>
              <View>
                <Text style={styles.reportTitle}>{tx("app.circle.info.reportMember")}</Text>
                <Text style={styles.reportSubtitle}>
                  {tx("circleInfo.memberInCircle", {
                    member: reportTarget?.name || tx("app.circle.info.thisMember"),
                    circle: circle.name,
                  })}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.76}
                style={styles.reportCloseButton}
                onPress={closeReportModal}
                accessibilityLabel={tx("app.circle.info.closeReportForm")}
              >
                <X size={20} color={Colors.textPrimary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <View style={styles.reasonGrid}>
              {REPORT_REASONS.map((reason) => {
                const selected = reason === reportReason;
                return (
                  <TouchableOpacity
                    key={reason}
                    activeOpacity={0.78}
                    style={[
                      styles.reasonChip,
                      selected && styles.reasonChipSelected,
                    ]}
                    onPress={() => setReportReason(reason)}
                  >
                    <Text
                      style={[
                        styles.reasonChipText,
                        selected && styles.reasonChipTextSelected,
                      ]}
                    >
                      {optionLabel(reason)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={reportDetails}
              onChangeText={setReportDetails}
              placeholder={tx("app.circle.info.addDetailsForModerators")}
              placeholderTextColor={Colors.textDisabled}
              multiline
              maxLength={500}
              style={styles.reportInput}
              textAlignVertical="top"
            />
            {reportError ? (
              <Text style={styles.reportError}>{reportError}</Text>
            ) : (
              <Text style={styles.reportFinePrint}>
                {tx("app.circle.info.reportsArePrivateAndReviewedBySociolModerators")}</Text>
            )}

            <TouchableOpacity
              activeOpacity={0.82}
              style={[
                styles.submitReportButton,
                reporting && styles.submitReportButtonDisabled,
              ]}
              onPress={submitReport}
              disabled={reporting}
            >
              {reporting ? (
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              ) : (
                <>
                  <Flag size={18} color={Colors.textPrimary} strokeWidth={2.2} />
                  <Text style={styles.submitReportText}>{tx("app.circle.info.submitReport")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(reportSuccess)}
        transparent
        animationType="fade"
        onRequestClose={() => setReportSuccess(null)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successDialog}>
            <View style={styles.successIcon}>
              <Flag size={22} color={Colors.textPrimary} strokeWidth={2.2} />
            </View>
            <Text style={styles.successTitle}>{tx("app.circle.info.reportSubmitted")}</Text>
            <Text style={styles.successText}>{reportSuccess}</Text>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.successButton}
              onPress={() => setReportSuccess(null)}
            >
              <Text style={styles.successButtonText}>{tx("app.circle.info.done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = createThemedStyles((Colors) => ({
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
    borderColor: Colors.surface,
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
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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
  reportMemberButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
  reportOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  reportScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  reportSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  reportHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  reportTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  reportSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  reportCloseButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.inputBg,
  },
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reasonChip: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reasonChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reasonChipText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  reasonChipTextSelected: {
    color: Colors.textPrimary,
  },
  reportInput: {
    minHeight: 104,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  reportFinePrint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  reportError: {
    ...Typography.bodySmall,
    color: Colors.danger,
    marginTop: Spacing.sm,
  },
  submitReportButton: {
    minHeight: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  submitReportButtonDisabled: {
    opacity: 0.72,
  },
  submitReportText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  successDialog: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.xl,
    backgroundColor: Colors.inputBg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  successText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  successButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  successButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
}));
