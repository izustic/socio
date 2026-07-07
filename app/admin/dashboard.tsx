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
  getModerationUsers,
  type ModerationLogEntry,
  type ModerationOverview,
  type ModerationUserSummary,
  } from "@/src/services/moderation";
import { router,
  useFocusEffect } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  Users,
  UserCog,
  RefreshCw,
  AlertTriangle,
  Home,
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

const toneStyles: Record<string, { backgroundColor: string; color: string }> = {
  active: { backgroundColor: "#E9F8ED", color: Colors.success },
  suspended: { backgroundColor: "#FFF4DD", color: Colors.primaryDark },
  banned: { backgroundColor: "#FDEBEC", color: Colors.danger },
  moderator: { backgroundColor: "#EEF2FF", color: "#4F46E5" },
  admin: { backgroundColor: "#F4E8FF", color: "#7C3AED" },
};

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const [overview, setOverview] = useState<ModerationOverview | null>(null);
  const [users, setUsers] = useState<ModerationUserSummary[]>([]);
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextOverview, nextUsers, nextLogs] = await Promise.all([
        getModerationOverview(),
        getModerationUsers(8),
        getModerationLogs(5),
      ]);

      setOverview(nextOverview);
      setUsers(nextUsers);
      setLogs(nextLogs);
    } catch (nextError) {
      console.error("Error loading admin dashboard:", nextError);
      setError("We could not load the admin overview right now.");
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

  if (!user || role?.role !== "admin") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerState}>
          <ShieldCheck size={36} color={Colors.primaryDark} strokeWidth={2} />
          <Text style={styles.centerTitle}>Admin access only</Text>
          <Text style={styles.centerText}>
            This dashboard is reserved for admin accounts.
          </Text>
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
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>Admin</Text>
            <Text style={styles.title}>System overview</Text>
            <Text style={styles.subtitle}>
              Keep an eye on account health, moderation volume, and the active queue.
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.refreshButton}
              onPress={() => router.replace("/(tabs)/home")}
              accessibilityLabel="Back to Sociol"
            >
              <Home size={18} color={Colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.refreshButton}
              onPress={onRefresh}
              accessibilityLabel="Refresh admin dashboard"
            >
              <RefreshCw size={18} color={Colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon={Users}
            label="Total users"
            value={overview?.totalUsers ?? 0}
          />
          <SummaryCard
            icon={Shield}
            label="Admins"
            value={overview?.admins ?? 0}
          />
          <SummaryCard
            icon={UserCog}
            label="Moderators"
            value={overview?.moderators ?? 0}
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Pending reports"
            value={overview?.pendingReports ?? 0}
            tone="warning"
          />
        </View>

        {error ? <Notice text={error} /> : null}

        <View style={styles.quickActions}>
          <Button
            title="Open user management"
            onPress={() => router.push("/admin/user-management")}
          />
          <Button
            title="Review reports"
            variant="outline"
            onPress={() => router.push("/moderator/dashboard")}
          />
        </View>

        <SectionTitle
          title="Flagged accounts"
          subtitle="Users with the most open reports are surfaced first."
        />
        <View style={styles.list}>
          {loading ? (
            <LoadingBlock />
          ) : users.length === 0 ? (
            <EmptyBlock
              icon={Users}
              title="No users found"
              message="Once users sign in, their moderation summary will appear here."
            />
          ) : (
            users.map((account) => (
              <TouchableOpacity
                key={account.id}
                activeOpacity={0.86}
                style={styles.userCard}
                onPress={() => router.push("/admin/user-management")}
              >
                <View style={styles.userRow}>
                  <Avatar
                    uri={account.photoUrl || undefined}
                    size={48}
                    placeholder={!account.photoUrl}
                  />
                  <View style={styles.userText}>
                    <Text style={styles.userName}>{account.displayName}</Text>
                    <Text style={styles.userMeta}>
                      {account.email || "No email"} • {account.reportCount} open report
                      {account.reportCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textSecondary} strokeWidth={2} />
                </View>
                <View style={styles.badgeRow}>
                  <StatusBadge label={account.role} tone={account.role} />
                  <StatusBadge label={account.status} tone={account.status} />
                </View>
                {account.latestReportReason ? (
                  <Text style={styles.userReason} numberOfLines={2}>
                    {account.latestReportReason}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))
          )}
        </View>

        <SectionTitle
          title="Recent actions"
          subtitle="The audit log shows the last moderation changes."
        />
        <View style={styles.logList}>
          {logs.length === 0 ? (
            <EmptyBlock
              icon={Shield}
              title="No audit log yet"
              message="Moderation actions will show up here after the queue is used."
            />
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <Text style={styles.logAction}>{log.action}</Text>
                <Text style={styles.logMeta}>
                  {log.moderator?.displayName || "Moderator"} →{" "}
                  {log.targetUser?.displayName || log.targetUserId}
                </Text>
                <Text style={styles.logTime}>{formatTimestamp(log.createdAt)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  tone?: "neutral" | "warning";
}) {
  const palette =
    tone === "warning"
      ? { backgroundColor: "#FFF4DD", color: Colors.primaryDark }
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
  const palette = toneStyles[tone] || {
    backgroundColor: Colors.inputBg,
    color: Colors.textSecondary,
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.statusBadgeText, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

function SectionTitle({
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

function LoadingBlock() {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={Colors.primary} />
      <Text style={styles.loadingText}>Loading admin data...</Text>
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

function Notice({ text }: { text: string }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{text}</Text>
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
    marginBottom: Spacing.lg,
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
  quickActions: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
  userCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  userText: {
    flex: 1,
  },
  userName: {
    ...Typography.h3,
    fontSize: 17,
  },
  userMeta: {
    ...Typography.bodySmall,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    flexWrap: "wrap",
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
  userReason: {
    ...Typography.bodySmall,
  },
  logList: {
    gap: Spacing.sm,
  },
  logCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
  },
  logAction: {
    ...Typography.body,
    fontWeight: "700",
    marginBottom: 2,
  },
  logMeta: {
    ...Typography.bodySmall,
  },
  logTime: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
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
  notice: {
    borderRadius: Radius.lg,
    backgroundColor: "#FFF4DD",
    padding: Spacing.md,
    marginBottom: Spacing.lg,
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
});
