import { SafeAreaView } from "react-native-safe-area-context";
import Avatar from "@/src/components/ui/Avatar";
import Input from "@/src/components/ui/Input";
import {
  Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  getModerationOverview,
  getModerationUsers,
  suspendUser,
  banUser,
  updateUserRole,
  updateUserStatus,
  type ModerationOverview,
  type ModerationUserSummary,
  } from "@/src/services/moderation";
import { router,
  useFocusEffect } from "expo-router";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  ShieldAlert,
  UserCog,
  UserPlus,
  UserX,
  } from "lucide-react-native";
import React,
  { useCallback,
  useMemo,
  useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatLocalizedDate, formatLocalizedDateTime, optionLabel, tx } from "@/src/utils/localization";

type StatusAction = "suspend" | "ban" | null;

const formatTimestamp = formatLocalizedDateTime;

const rolePalette: Record<string, { backgroundColor: string; color: string }> = {
  admin: { backgroundColor: "#F4E8FF", color: "#7C3AED" },
  moderator: { backgroundColor: "#EEF2FF", color: "#4F46E5" },
  user: { backgroundColor: Colors.inputBg, color: Colors.textSecondary },
};

const statusPalette: Record<string, { backgroundColor: string; color: string }> = {
  active: { backgroundColor: "#E9F8ED", color: Colors.success },
  suspended: { backgroundColor: "#FFF4DD", color: Colors.primaryDark },
  banned: { backgroundColor: "#FDEBEC", color: Colors.danger },
};

export default function UserManagement() {
  const { user, role } = useAuth();
  const [overview, setOverview] = useState<ModerationOverview | null>(null);
  const [users, setUsers] = useState<ModerationUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ModerationUserSummary | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction>(null);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("7");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextOverview, nextUsers] = await Promise.all([
        getModerationOverview(),
        getModerationUsers(100),
      ]);
      setOverview(nextOverview);
      setUsers(nextUsers);
      setMessage(null);
    } catch (error) {
      console.error("Error loading user management:", error);
      setMessage(tx("admin.loadUsersError"));
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

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((item) => {
      const haystack = [
        item.displayName,
        item.email,
        item.role,
        item.status,
        item.latestReportReason ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, users]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openStatusAction = (
    account: ModerationUserSummary,
    nextAction: Exclude<StatusAction, null>,
  ) => {
    setSelectedUser(account);
    setReason("");
    setDays("7");
    setStatusAction(nextAction);
  };

  const closeStatusAction = () => {
    if (saving) return;
    setStatusAction(null);
  };

  const confirmStatusAction = async () => {
    if (!selectedUser || !user || !statusAction) return;

    try {
      setSaving(true);
      if (statusAction === "suspend") {
        const parsedDays = Number.parseInt(days, 10);
        const safeDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 7;
        const suspendedUntil = new Date(
          Date.now() + safeDays * 24 * 60 * 60 * 1000,
        ).toISOString();

        await suspendUser({
          userId: selectedUser.id,
          suspendedUntil,
          reason: reason.trim() || "Suspended from admin tools",
          moderatorId: user.id,
          metadata: {
            origin: "admin_user_management",
          },
        });
      } else if (statusAction === "ban") {
        await banUser({
          userId: selectedUser.id,
          reason: reason.trim() || "Banned from admin tools",
          moderatorId: user.id,
          metadata: {
            origin: "admin_user_management",
          },
        });
      }

      setMessage(
        statusAction === "suspend"
          ? tx("admin.userSuspended", { name: selectedUser.displayName })
          : tx("admin.userBanned", { name: selectedUser.displayName }),
      );
      setStatusAction(null);
      setSelectedUser(null);
      await load();
    } catch (error) {
      console.error("Error applying user status action:", error);
      setMessage(tx("admin.statusChangeError"));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (
    account: ModerationUserSummary,
    nextRole: "user" | "moderator",
  ) => {
    if (!user) return;

    try {
      setSaving(true);
      await updateUserRole({
        userId: account.id,
        role: nextRole,
        moderatorId: user.id,
        reason: nextRole === "moderator" ? "Promoted from admin tools" : "Demoted from admin tools",
        metadata: {
          origin: "admin_user_management",
        },
      });
      setMessage(tx("admin.roleChanged", {
        name: account.displayName,
        role: optionLabel(nextRole),
      }));
      setSelectedUser(null);
      await load();
    } catch (error) {
      console.error("Error updating user role:", error);
      setMessage(tx("admin.roleChangeError"));
    } finally {
      setSaving(false);
    }
  };

  if (!user || role?.role !== "admin") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerState}>
          <ShieldAlert size={36} color={Colors.primaryDark} strokeWidth={2} />
          <Text style={styles.centerTitle}>{tx("app.admin.userManagement.adminAccessOnly")}</Text>
          <Text style={styles.centerText}>
            {tx("app.admin.userManagement.userManagementIsReservedForAdminAccounts")}</Text>
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
          >
            <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>{tx("app.admin.userManagement.admin")}</Text>
            <Text style={styles.title}>{tx("app.admin.userManagement.userManagement")}</Text>
            <Text style={styles.subtitle}>
              {tx("app.admin.userManagement.reviewAccountsChangeRolesAndCorrectProblemUsers")}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <RefreshCw size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon={UserCog}
            label={tx("app.admin.userManagement.moderators")}
            value={overview?.moderators ?? 0}
          />
          <SummaryCard
            icon={UserPlus}
            label={tx("app.admin.userManagement.active")}
            value={overview?.activeUsers ?? 0}
            tone="success"
          />
          <SummaryCard
            icon={UserX}
            label={tx("app.admin.userManagement.suspended")}
            value={overview?.suspendedUsers ?? 0}
            tone="warning"
          />
          <SummaryCard
            icon={Ban}
            label={tx("app.admin.userManagement.banned")}
            value={overview?.bannedUsers ?? 0}
            tone="danger"
          />
        </View>

        {message ? <Notice text={message} /> : null}

        <Input
          placeholder={tx("app.admin.userManagement.searchUsers")}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>{tx("app.admin.userManagement.accounts")}</Text>
          <Text style={styles.sectionSubtitle}>{filteredUsers.length} {tx("app.admin.userManagement.shown")}</Text>
        </View>

        <View style={styles.list}>
          {loading ? (
            <LoadingBlock />
          ) : filteredUsers.length === 0 ? (
            <EmptyBlock
              icon={Shield}
              title={tx("app.admin.userManagement.noUsersMatch")}
              message={tx("app.admin.userManagement.tryADifferentNameEmailRoleOrStatus")}
            />
          ) : (
            filteredUsers.map((account) => {
              const isSelf = account.id === user.id;
              const canChangeRole = !isSelf && account.role !== "admin";
              const canSuspend = !isSelf && account.role !== "admin";
              const canBan = !isSelf && account.role !== "admin";
              return (
                <TouchableOpacity
                  key={account.id}
                  activeOpacity={0.86}
                  style={styles.userCard}
                  onPress={() => setSelectedUser(account)}
                >
                  <View style={styles.userTopRow}>
                    <View style={styles.userRow}>
                      <Avatar
                        uri={account.photoUrl || undefined}
                        size={48}
                        placeholder={!account.photoUrl}
                      />
                      <View style={styles.userText}>
                        <Text style={styles.userName}>{account.displayName}</Text>
                        <Text style={styles.userMeta}>
                          {account.email || tx("app.admin.userManagement.noEmail")} • {formatTimestamp(account.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={Colors.textSecondary} strokeWidth={2} />
                  </View>

                  <View style={styles.badgeRow}>
                    <StatusBadge label={optionLabel(account.role)} tone={account.role} />
                    <StatusBadge label={optionLabel(account.status)} tone={account.status} />
                    <ReportBadge count={account.reportCount} />
                  </View>

                  {account.latestReportReason ? (
                    <Text style={styles.userReason} numberOfLines={2}>
                      {account.latestReportReason}
                    </Text>
                  ) : null}

                  <View style={styles.actionRow}>
                    {canChangeRole ? (
                      <TinyAction
                        label={account.role === "moderator" ? tx("app.admin.userManagement.demote") : tx("app.admin.userManagement.promote")}
                        onPress={() =>
                          Alert.alert(
                            account.role === "moderator"
                              ? tx("app.admin.userManagement.demoteModerator")
                              : tx("app.admin.userManagement.promoteToModerator"),
                            account.role === "moderator"
                              ? tx("app.admin.userManagement.thisWillRemoveModeratorAccessFromTheAccount")
                              : tx("app.admin.userManagement.thisWillGrantModeratorAccessToTheAccount"),
                            [
                              { text: tx("app.admin.userManagement.cancel"), style: "cancel" },
                              {
                                text: account.role === "moderator" ? tx("app.admin.userManagement.demote") : tx("app.admin.userManagement.promote"),
                                style: "default",
                                onPress: async () => {
                                  await handleRoleChange(
                                    account,
                                    account.role === "moderator" ? "user" : "moderator",
                                  );
                                },
                              },
                            ],
                          )
                        }
                      />
                    ) : null}
                    {canSuspend ? (
                      <TinyAction
                        label={tx("app.admin.userManagement.suspend")}
                        onPress={() => openStatusAction(account, "suspend")}
                      />
                    ) : null}
                    {canBan ? (
                      <TinyAction
                        label={tx("app.admin.userManagement.ban")}
                        danger
                        onPress={() => openStatusAction(account, "ban")}
                      />
                    ) : null}
                    {account.status === "suspended" && !isSelf ? (
                      <TinyAction
                        label={tx("app.admin.userManagement.reactivate")}
                        onPress={() =>
                          Alert.alert(
                            tx("app.admin.userManagement.reactivateUser"),
                            tx("app.admin.userManagement.thisWillRestoreTheAccountToActiveStatus"),
                            [
                              { text: tx("app.admin.userManagement.cancel"), style: "cancel" },
                              {
                                text: tx("app.admin.userManagement.reactivate"),
                                onPress: async () => {
                                  try {
                                    setSaving(true);
                                    await updateUserStatus({
                                      userId: account.id,
                                      status: "active",
                                      moderatorId: user.id,
                                      reason: "Reactivated from admin tools",
                                      metadata: { origin: "admin_user_management" },
                                    });
                                    setMessage(tx("admin.userReactivated", { name: account.displayName }));
                                    setSelectedUser(null);
                                    await load();
                                  } catch (error) {
                                    console.error("Error reactivating user:", error);
                                    setMessage(tx("admin.reactivationError"));
                                  } finally {
                                    setSaving(false);
                                  }
                                },
                              },
                            ],
                          )
                        }
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={statusAction !== null && selectedUser !== null}
        transparent
        animationType="fade"
        onRequestClose={closeStatusAction}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {statusAction === "suspend" ? tx("app.admin.userManagement.suspendUser") : tx("app.admin.userManagement.banUser")}
            </Text>
            <Text style={styles.modalMessage}>
              {selectedUser?.displayName}
            </Text>
            <Input
              placeholder={tx("app.admin.userManagement.reason")}
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              style={styles.reasonInput}
            />

            {statusAction === "suspend" ? (
              <>
                <Text style={styles.modalLabel}>{tx("app.admin.userManagement.suspensionLengthInDays")}</Text>
                <Input
                  placeholder="7"
                  keyboardType="number-pad"
                  value={days}
                  onChangeText={setDays}
                  style={styles.dayInput}
                />
                <Text style={styles.helperText}>
                  {tx("app.admin.userManagement.thisWillExpireOn")}{" "}
                  {formatLocalizedDate(new Date(
                    Date.now() +
                      (Number.parseInt(days, 10) > 0 ? Number.parseInt(days, 10) : 7) *
                        24 *
                        60 *
                        60 *
                        1000,
                  ), {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  .
                </Text>
              </>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={closeStatusAction}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>{tx("app.admin.userManagement.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[
                  styles.modalButton,
                  statusAction === "ban" ? styles.dangerButton : styles.primaryButton,
                  saving && styles.disabledButton,
                ]}
                onPress={confirmStatusAction}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {statusAction === "suspend" ? tx("app.admin.userManagement.suspend") : tx("app.admin.userManagement.ban")}
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const palette =
    tone === "success"
      ? { backgroundColor: "#E9F8ED", color: Colors.success }
      : tone === "warning"
        ? { backgroundColor: "#FFF4DD", color: Colors.primaryDark }
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
  const palette = rolePalette[tone] || statusPalette[tone] || {
    backgroundColor: Colors.inputBg,
    color: Colors.textSecondary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

function ReportBadge({ count }: { count: number }) {
  return (
    <View style={styles.reportBadge}>
      <Shield size={14} color={Colors.textSecondary} strokeWidth={2} />
      <Text style={styles.reportBadgeText}>
        {count === 1
          ? tx("moderation.oneOpenReport")
          : tx("moderation.openReportCount", { count })}
      </Text>
    </View>
  );
}

function TinyAction({
  label,
  danger = false,
  onPress,
}: {
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.tinyAction, danger && styles.tinyActionDanger]}
      onPress={onPress}
    >
      <Text style={[styles.tinyActionText, danger && styles.tinyActionDangerText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function LoadingBlock() {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={Colors.primary} />
      <Text style={styles.loadingText}>{tx("app.admin.userManagement.loadingUsers")}</Text>
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
    gap: Spacing.sm,
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
  searchInput: {
    marginBottom: Spacing.md,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 20,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
  },
  list: {
    gap: Spacing.sm,
  },
  userCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
  },
  userTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  badgeText: {
    ...Typography.label,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  reportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
  },
  reportBadgeText: {
    ...Typography.bodySmall,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  userReason: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tinyAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tinyActionDanger: {
    backgroundColor: "#FDEBEC",
    borderColor: "#F5C2C7",
  },
  tinyActionText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  tinyActionDangerText: {
    color: Colors.danger,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
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
    backgroundColor: Colors.white,
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
