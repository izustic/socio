import { SafeAreaView } from "react-native-safe-area-context";
import Avatar from "@/src/components/ui/Avatar";
import Button from "@/src/components/ui/Button";
import {
  Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  getModerationLogs,
  getModerationOverview,
  getReports,
  type ModerationLogEntry,
  type ModerationOverview,
  type ModerationReportWithProfiles,
  } from "@/src/services/moderation";
import { router,
  useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Home,
  RefreshCw,
  Shield,
  Users,
  } from "lucide-react-native";
import React,
  { useCallback,
  useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatLocalizedDateTime, optionLabel, tx } from "@/src/utils/localization";

const formatTimestamp = formatLocalizedDateTime;

const toneStyles: Record<string, { backgroundColor: string; color: string }> = {
  pending: { backgroundColor: "#FFF4DD", color: Colors.primaryDark },
  resolved: { backgroundColor: "#E9F8ED", color: Colors.success },
  dismissed: { backgroundColor: "#F1F1F1", color: Colors.textSecondary },
};

export default function ModeratorDashboard() {
  const { user, role } = useAuth();
  const [overview, setOverview] = useState<ModerationOverview | null>(null);
  const [reports, setReports] = useState<ModerationReportWithProfiles[]>([]);
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextOverview, nextReports, nextLogs] = await Promise.all([
        getModerationOverview(),
        getReports("pending", 20),
        getModerationLogs(6),
      ]);

      setOverview(nextOverview);
      setReports(nextReports);
      setLogs(nextLogs);
    } catch (nextError) {
      console.error("Error loading moderator dashboard:", nextError);
      setError(tx("app.moderator.dashboard.weCouldNotLoadTheModerationQueueRightNow"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (!user || role?.role === "user") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerState}>
          <Shield size={36} color={Colors.primaryDark} strokeWidth={2} />
          <Text style={styles.centerTitle}>{tx("app.moderator.dashboard.moderationAccessOnly")}</Text>
          <Text style={styles.centerText}>
            {tx("app.moderator.dashboard.thisAreaIsReservedForModeratorAccounts")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel={tx("app.moderator.dashboard.goBack")}
          >
            <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>{tx("app.moderator.dashboard.moderator")}</Text>
            <Text style={styles.title}>{tx("app.moderator.dashboard.reportsQueue")}</Text>
            <Text style={styles.subtitle}>
              {tx("app.moderator.dashboard.reviewUserReportsTakeActionAndKeepTheAudit")}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.refreshButton}
              onPress={() => router.replace("/(tabs)/home")}
              accessibilityLabel={tx("app.moderator.dashboard.backToSociol")}
            >
              <Home size={18} color={Colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.refreshButton}
              onPress={onRefresh}
              accessibilityLabel={tx("app.moderator.dashboard.refreshModerationQueue")}
            >
              <RefreshCw size={18} color={Colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon={AlertTriangle}
            label={tx("app.moderator.dashboard.openReports")}
            value={overview?.pendingReports ?? reports.length}
            tone="warning"
          />
          <SummaryCard
            icon={Users}
            label={tx("app.moderator.dashboard.totalUsers")}
            value={overview?.totalUsers ?? 0}
            tone="neutral"
          />
          <SummaryCard
            icon={Shield}
            label={tx("app.moderator.dashboard.resolved")}
            value={overview?.resolvedReports ?? 0}
            tone="success"
          />
          <SummaryCard
            icon={Ban}
            label={tx("app.moderator.dashboard.banned")}
            value={overview?.bannedUsers ?? 0}
            tone="danger"
          />
        </View>

        {error ? <InlineNotice tone="danger" text={error} /> : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{tx("app.moderator.dashboard.pendingReports")}</Text>
            <Text style={styles.sectionSubtitle}>
              {reports.length === 0
                ? tx("app.moderator.dashboard.nothingIsWaitingRightNow")
                : tx("app.moderator.dashboard.openAReportToReviewTheCaseAndApply")}
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {loading ? (
            <LoadingBlock />
          ) : reports.length === 0 ? (
            <EmptyBlock
              icon={FileText}
              title={tx("app.moderator.dashboard.noPendingReports")}
              message={tx("app.moderator.dashboard.reportsThatComeInWillShowUpHereAutomatically")}
            />
          ) : (
            reports.map((report) => {
              const label = toneStyles[report.status] ? report.status : "pending";
              const reporterName = report.reporter?.displayName || tx("moderation.anonymousReporter");
              const reportedName =
                report.reportedUser?.displayName || report.reportedUserId;
              return (
                <TouchableOpacity
                  key={report.id}
                  activeOpacity={0.86}
                  style={styles.reportCard}
                  onPress={() =>
                    router.push({
                      pathname: "/moderator/report-detail",
                      params: { reportId: report.id },
                    })
                  }
                >
                  <View style={styles.reportTopRow}>
                    <View style={styles.avatarRow}>
                      <Avatar
                        uri={report.reportedUser?.photoUrl || undefined}
                        size={44}
                        placeholder={!report.reportedUser?.photoUrl}
                      />
                      <View style={styles.reportTextBlock}>
                        <Text style={styles.reportTitle}>{reportedName}</Text>
                        <Text style={styles.reportMeta}>
                          {tx("moderation.reportedByOn", {
                            name: reporterName,
                            date: formatTimestamp(report.createdAt),
                          })}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge label={optionLabel(label)} tone={label} />
                  </View>

                  <Text style={styles.reportReason} numberOfLines={2}>
                    {optionLabel(report.reason)}
                  </Text>

                  {report.details ? (
                    <Text style={styles.reportDetails} numberOfLines={2}>
                      {report.details}
                    </Text>
                  ) : null}

                  <View style={styles.reportFooter}>
                    <View style={styles.footerChip}>
                      <Clock3 size={14} color={Colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.footerChipText}>{tx("app.moderator.dashboard.openCase")}</Text>
                    </View>
                    <ChevronRight size={18} color={Colors.textSecondary} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{tx("app.moderator.dashboard.recentActions")}</Text>
            <Text style={styles.sectionSubtitle}>
              {tx("app.moderator.dashboard.recentAuditLogEntriesWrittenByModerationActions")}</Text>
          </View>
        </View>

        <View style={styles.logList}>
          {logs.length === 0 ? (
            <EmptyBlock
              icon={Shield}
              title={tx("app.moderator.dashboard.noAuditEntriesYet")}
              message={tx("app.moderator.dashboard.moderationActionsWillAppearHereOnceTheQueueIs")}
            />
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logRow}>
                  <View style={styles.logIcon}>
                    <Shield size={18} color={Colors.textPrimary} strokeWidth={2} />
                  </View>
                  <View style={styles.logText}>
                    <Text style={styles.logAction}>{log.action}</Text>
                    <Text style={styles.logMeta}>
                      {log.moderator?.displayName || tx("app.moderator.dashboard.moderator")} →{" "}
                      {log.targetUser?.displayName || log.targetUserId}
                    </Text>
                  </View>
                </View>
                <Text style={styles.logTime}>{formatTimestamp(log.createdAt)}</Text>
              </View>
            ))
          )}
        </View>

        {role?.role === "admin" ? (
          <View style={styles.actionRow}>
            <Button
              title={tx("app.moderator.dashboard.openUserManagement")}
              onPress={() => router.push("/admin/user-management")}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  tone: "warning" | "neutral" | "success" | "danger";
}) {
  const palette =
    tone === "warning"
      ? { backgroundColor: "#FFF4DD", color: Colors.primaryDark }
      : tone === "success"
        ? { backgroundColor: "#E9F8ED", color: Colors.success }
        : tone === "danger"
          ? { backgroundColor: "#FDEBEC", color: Colors.danger }
          : { backgroundColor: Colors.inputBg, color: Colors.textPrimary };

  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: palette.backgroundColor }]}>
        <Icon size={18} color={palette.color} strokeWidth={2} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const palette =
    toneStyles[tone] || toneStyles.pending;

  return (
    <View style={[styles.statusBadge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.statusBadgeText, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

function LoadingBlock() {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={Colors.primary} />
      <Text style={styles.loadingText}>{tx("app.moderator.dashboard.loadingModerationData")}</Text>
    </View>
  );
}

function EmptyBlock({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyBlock}>
      <View style={styles.emptyIcon}>
        <Icon size={18} color={Colors.textPrimary} strokeWidth={2} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

function InlineNotice({ tone, text }: { tone: "danger" | "warning"; text: string }) {
  const palette =
    tone === "danger"
      ? { backgroundColor: "#FDEBEC", borderColor: "#F5C2C7", color: Colors.danger }
      : { backgroundColor: "#FFF4DD", borderColor: "#F4D69A", color: Colors.primaryDark };

  return (
    <View style={[styles.inlineNotice, palette]}>
      <Text style={[styles.inlineNoticeText, { color: palette.color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    maxWidth: 320,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    width: "48%",
    minHeight: 112,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    justifyContent: "space-between",
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    ...Typography.h1,
    fontSize: 28,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  summaryLabel: {
    ...Typography.bodySmall,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
  },
  list: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  reportCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
  },
  reportTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  reportTextBlock: {
    flex: 1,
    gap: 2,
  },
  reportTitle: {
    ...Typography.h3,
    fontSize: 17,
  },
  reportMeta: {
    ...Typography.bodySmall,
  },
  reportReason: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  reportDetails: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  reportFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
  },
  footerChipText: {
    ...Typography.bodySmall,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    ...Typography.label,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  logList: {
    gap: Spacing.sm,
  },
  logCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logText: {
    flex: 1,
  },
  logAction: {
    ...Typography.body,
    fontWeight: "700",
  },
  logMeta: {
    ...Typography.bodySmall,
  },
  logTime: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  actionRow: {
    marginTop: Spacing.xl,
  },
  loadingBlock: {
    minHeight: 140,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySmall,
  },
  emptyBlock: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: 4,
  },
  emptyMessage: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  inlineNotice: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  inlineNoticeText: {
    ...Typography.bodySmall,
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
    textAlign: "center",
    color: Colors.textSecondary,
  },
});
