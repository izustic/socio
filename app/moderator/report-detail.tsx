import { SafeAreaView } from "react-native-safe-area-context";
import Avatar from "@/src/components/ui/Avatar";
import Input from "@/src/components/ui/Input";
import { createThemedStyles,
  Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  banUser,
  dismissReport,
  getReportById,
  suspendUser,
  type ModerationReportWithProfiles,
  } from "@/src/services/moderation";
import { router,
  useFocusEffect,
  useLocalSearchParams } from "expo-router";
import {
  Ban,
  ChevronLeft,
  Flag,
  Shield,
  ShieldAlert,
  UserX,
  } from "lucide-react-native";
import React,
  { useCallback,
  useMemo,
  useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatLocalizedDate, formatLocalizedDateTime, optionLabel, tx } from "@/src/utils/localization";

type ActionKind = "dismiss" | "suspend" | "ban" | null;

const formatTimestamp = formatLocalizedDateTime;

const formatDate = (value: string | null | undefined) =>
  value
    ? formatLocalizedDate(value, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : tx("moderation.notSet");

export default function ReportDetail() {
  const params = useLocalSearchParams<{ reportId?: string | string[] }>();
  const reportId = Array.isArray(params.reportId) ? params.reportId[0] : params.reportId;
  const { user, role } = useAuth();

  const [report, setReport] = useState<ModerationReportWithProfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<ActionKind>(null);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("7");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!reportId) {
      setLoading(false);
      return;
    }

    try {
      setMessage(null);
      const nextReport = await getReportById(reportId);
      setReport(nextReport);
    } catch (error) {
      console.error("Error loading report detail:", error);
      setMessage(tx("moderation.loadReportError"));
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const reportIsClosed = report ? report.status !== "pending" : false;
  const suspendPreview = useMemo(() => {
    const parsedDays = Number.parseInt(days, 10);
    const safeDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 7;
    const until = new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
    return until;
  }, [days]);

  const openAction = (nextAction: Exclude<ActionKind, null>) => {
    setReason(report?.reason || "");
    setDays("7");
    setAction(nextAction);
  };

  const closeAction = () => {
    if (saving) return;
    setAction(null);
  };

  const confirmAction = async () => {
    if (!report || !user) return;

    try {
      setSaving(true);
      setMessage(null);

      if (action === "dismiss") {
        await dismissReport({
          reportId: report.id,
          moderatorId: user.id,
          reason: reason.trim() || report.reason,
          metadata: { circleId: report.circleId, messageId: report.messageId },
        });
        setMessage(tx("moderation.reportDismissed"));
      } else if (action === "suspend") {
        await suspendUser({
          userId: report.reportedUserId,
          suspendedUntil: suspendPreview.toISOString(),
          reason: reason.trim() || report.reason,
          moderatorId: user.id,
          reportId: report.id,
          metadata: { circleId: report.circleId, messageId: report.messageId },
        });
        setMessage(tx("moderation.userSuspended"));
      } else if (action === "ban") {
        await banUser({
          userId: report.reportedUserId,
          reason: reason.trim() || report.reason,
          moderatorId: user.id,
          reportId: report.id,
          metadata: { circleId: report.circleId, messageId: report.messageId },
        });
        setMessage(tx("moderation.userBanned"));
      }

      setAction(null);
      await load();
    } catch (error) {
      console.error("Error applying moderation action:", error);
      setMessage(tx("moderation.actionError"));
    } finally {
      setSaving(false);
    }
  };

  if (!user || (role?.role !== "moderator" && role?.role !== "admin")) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <View style={styles.centerState}>
          <ShieldAlert size={36} color={Colors.primaryDark} strokeWidth={2} />
          <Text style={styles.centerTitle}>{tx("app.moderator.reportDetail.moderatorAccessOnly")}</Text>
          <Text style={styles.centerText}>
            {tx("app.moderator.reportDetail.thisReportDetailScreenIsReservedForModeratorAccounts")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>{tx("app.moderator.reportDetail.moderator")}</Text>
          <Text style={styles.title}>{tx("app.moderator.reportDetail.reportDetail")}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.centerText}>{tx("app.moderator.reportDetail.loadingReport")}</Text>
        </View>
      ) : !report ? (
        <View style={styles.centerState}>
          <Flag size={36} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.centerTitle}>{tx("app.moderator.reportDetail.reportNotFound")}</Text>
          <Text style={styles.centerText}>
            {tx("app.moderator.reportDetail.theReportMayHaveAlreadyBeenReviewedOrRemoved")}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {message ? <Notice text={message} /> : null}

          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryHeader}>
                <View style={styles.reportIcon}>
                  <Flag size={18} color={Colors.primaryDark} strokeWidth={2} />
                </View>
                <View style={styles.summaryText}>
                  <Text style={styles.sectionTitle}>{optionLabel(report.reason)}</Text>
                  <Text style={styles.sectionSubtitle}>
                    {tx("moderation.filedOn", { date: formatTimestamp(report.createdAt) })}
                  </Text>
                </View>
              </View>
              <StatusPill status={report.status} />
            </View>
            {report.details ? (
              <Text style={styles.summaryBody}>{report.details}</Text>
            ) : (
              <Text style={styles.summaryBodyMuted}>
                {tx("app.moderator.reportDetail.noExtraDetailsWereAttachedToThisReport")}</Text>
            )}
          </View>

          <View style={styles.profileGrid}>
            <ProfileCard
              label={tx("app.moderator.reportDetail.reporter")}
              name={report.reporter?.displayName || report.reporterId}
              subtitle={report.reporter?.email || tx("app.moderator.reportDetail.noEmailOnFile")}
              avatarUrl={report.reporter?.photoUrl}
            />
            <ProfileCard
              label={tx("app.moderator.reportDetail.reportedUser")}
              name={report.reportedUser?.displayName || report.reportedUserId}
              subtitle={report.reportedUser?.email || tx("app.moderator.reportDetail.noEmailOnFile")}
              avatarUrl={report.reportedUser?.photoUrl}
              dangerous
            />
          </View>

          <View style={styles.infoCard}>
            <SectionHeader title={tx("app.moderator.reportDetail.caseContext")} />
            <InfoRow label={tx("app.moderator.reportDetail.circleId")} value={report.circleId || tx("moderation.notLinked")} />
            <InfoRow label={tx("app.moderator.reportDetail.messageId")} value={report.messageId || tx("moderation.notLinked")} />
            <InfoRow label={tx("app.moderator.reportDetail.reviewedBy")} value={report.reviewedBy || tx("moderation.notReviewed")} />
            <InfoRow label={tx("app.moderator.reportDetail.reviewedAt")} value={formatDate(report.reviewedAt)} />
          </View>

          <View style={styles.actionsCard}>
            <SectionHeader
              title={tx("app.moderator.reportDetail.actions")}
              subtitle={
                reportIsClosed
                  ? tx("app.moderator.reportDetail.thisReportHasAlreadyBeenReviewed")
                  : tx("app.moderator.reportDetail.chooseTheLeastDisruptiveActionThatFixesTheCase")
              }
            />
            <View style={styles.actionButtons}>
              <ActionButton
                icon={Shield}
                label={tx("app.moderator.reportDetail.dismiss")}
                onPress={() => openAction("dismiss")}
                disabled={reportIsClosed}
              />
              <ActionButton
                icon={UserX}
                label={tx("app.moderator.reportDetail.suspend")}
                onPress={() => openAction("suspend")}
                disabled={reportIsClosed}
              />
              <ActionButton
                icon={Ban}
                label={tx("app.moderator.reportDetail.ban")}
                danger
                onPress={() => openAction("ban")}
                disabled={reportIsClosed}
              />
            </View>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={action !== null}
        transparent
        animationType="fade"
        onRequestClose={closeAction}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {action === "dismiss"
                ? tx("app.moderator.reportDetail.dismissReport")
                : action === "suspend"
                  ? tx("app.moderator.reportDetail.suspendUser")
                  : tx("app.moderator.reportDetail.banUser")}
            </Text>
            <Text style={styles.modalMessage}>
              {action === "dismiss"
                ? tx("app.moderator.reportDetail.addAnOptionalNoteAndCloseTheReport")
                : action === "suspend"
                  ? tx("app.moderator.reportDetail.setAShortSuspensionAndKeepTheReasonOn")
                  : tx("app.moderator.reportDetail.confirmTheBanAndLogTheReasonForThe")}
            </Text>

            <Input
              placeholder={tx("app.moderator.reportDetail.reason")}
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              style={styles.reasonInput}
            />

            {action === "suspend" ? (
              <>
                <Text style={styles.modalLabel}>{tx("app.moderator.reportDetail.suspensionLengthInDays")}</Text>
                <Input
                  placeholder="7"
                  keyboardType="number-pad"
                  value={days}
                  onChangeText={setDays}
                  style={styles.dayInput}
                />
                <Text style={styles.helperText}>
                  {tx("moderation.suspendsUntil", { date: formatLocalizedDate(suspendPreview, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) })}
                </Text>
              </>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={closeAction}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>{tx("app.moderator.reportDetail.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[
                  styles.modalButton,
                  action === "ban" ? styles.dangerButton : styles.primaryButton,
                  saving && styles.disabledButton,
                ]}
                onPress={confirmAction}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {action === "dismiss"
                      ? tx("app.moderator.reportDetail.dismiss")
                      : action === "suspend"
                        ? tx("app.moderator.reportDetail.suspend")
                        : tx("app.moderator.reportDetail.ban")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const palette =
    status === "pending"
      ? { backgroundColor: Colors.warningSurface, color: Colors.primaryDark }
      : status === "resolved"
        ? { backgroundColor: Colors.successSurface, color: Colors.success }
        : { backgroundColor: Colors.inputBg, color: Colors.textSecondary };

  return (
    <View style={[styles.statusPill, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.statusPillText, { color: palette.color }]}>{optionLabel(status)}</Text>
    </View>
  );
}

function ProfileCard({
  label,
  name,
  subtitle,
  avatarUrl,
  dangerous = false,
}: {
  label: string;
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  dangerous?: boolean;
}) {
  return (
    <View style={styles.profileCard}>
      <Text style={styles.profileLabel}>{label}</Text>
      <View style={styles.profileRow}>
        <Avatar uri={avatarUrl || undefined} size={48} placeholder={!avatarUrl} />
        <View style={styles.profileText}>
          <Text style={[styles.profileName, dangerous && styles.dangerText]}>{name}</Text>
          <Text style={styles.profileSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onPress,
  danger = false,
  disabled = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[
        styles.actionButton,
        danger && styles.actionButtonDanger,
        disabled && styles.actionButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Icon
        size={18}
        color={danger ? Colors.danger : Colors.textPrimary}
        strokeWidth={2}
      />
      <Text style={[styles.actionButtonText, danger && styles.actionButtonDangerText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    ...Typography.label,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  title: {
    ...Typography.h2,
    fontSize: 28,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  summaryCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 18,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
  },
  summaryBody: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  summaryBodyMuted: {
    ...Typography.bodySmall,
    marginTop: Spacing.md,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  statusPillText: {
    ...Typography.label,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  profileGrid: {
    gap: Spacing.sm,
  },
  profileCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
  },
  profileLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    ...Typography.h3,
    fontSize: 17,
  },
  profileSubtitle: {
    ...Typography.bodySmall,
  },
  dangerText: {
    color: Colors.danger,
  },
  infoCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    gap: 10,
  },
  sectionHeader: {
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  infoLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...Typography.bodySmall,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1.4,
    textAlign: "right",
  },
  actionsCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
  },
  actionButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    minHeight: 54,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  actionButtonDanger: {
    borderColor: "#F5C2C7",
    backgroundColor: Colors.dangerSurface,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  actionButtonDangerText: {
    color: Colors.danger,
  },
  notice: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.warningSurface,
    padding: Spacing.md,
  },
  noticeText: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: "600",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  centerTitle: {
    ...Typography.h2,
    textAlign: "center",
  },
  centerText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  modalCard: {
    width: "100%",
    borderRadius: Radius.xl,
    backgroundColor: Colors.inputBg,
    padding: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 22,
    marginBottom: 6,
  },
  modalMessage: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  reasonInput: {
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: Spacing.md,
  },
  modalLabel: {
    ...Typography.label,
    marginBottom: 6,
  },
  dayInput: {
    marginBottom: 6,
  },
  helperText: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  dangerButton: {
    backgroundColor: Colors.danger,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
}));
