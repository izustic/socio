import { SafeAreaView } from "react-native-safe-area-context";
import Avatar from "@/src/components/ui/Avatar";
import { createThemedStyles,
  Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  BlockedAccount,
  buildUserDataExport,
  getBlockedAccounts,
  getReportHistory,
  getSettingsSnapshot,
  PrivacySettings,
  ReportHistoryItem,
  subscribeToSafetyChanges,
  subscribeToSettings,
  unblockAccount,
  updatePrivacySettings,
  verifyProfilePhoto,
  } from "@/src/services/settings";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Flag,
  Lock,
  MapPin,
  ShieldCheck,
  Trash2,
  UserX,
  } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import React,
  { useCallback,
  useEffect,
  useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatLocalizedDate, optionLabel, tx } from "@/src/utils/localization";

type PrivacyKey = keyof PrivacySettings;

const visibilityRows: {
  key: PrivacyKey;
  titleKey: string;
  bodyKey: string;
  Icon: LucideIcon;
}[] = [
  {
    key: "showInCircleSwipes",
    titleKey: "privacy.showInCircleSwipes",
    bodyKey: "privacy.showInCircleSwipesDescription",
    Icon: Eye,
  },
  {
    key: "shareApproximateDistance",
    titleKey: "privacy.shareApproximateDistance",
    bodyKey: "privacy.shareApproximateDistanceDescription",
    Icon: MapPin,
  },
  {
    key: "privateProfile",
    titleKey: "privacy.privateProfile",
    bodyKey: "privacy.privateProfileDescription",
    Icon: Lock,
  },
];

export default function PrivacySafetyScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [verifiedPhoto, setVerifiedPhoto] = useState(false);
  const [blocked, setBlocked] = useState<BlockedAccount[]>([]);
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PrivacyKey | null>(null);
  const [blockedVisible, setBlockedVisible] = useState(false);
  const [reportsVisible, setReportsVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSafetyLists = useCallback(async () => {
    if (!user) return;
    const [blockedRows, reportRows] = await Promise.all([
      getBlockedAccounts(user.id),
      getReportHistory(user.id),
    ]);
    setBlocked(blockedRows);
    setReports(reportRows);
  }, [user]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) return;

      try {
        const snapshot = await getSettingsSnapshot(user.id);
        const [blockedRows, reportRows] = await Promise.all([
          getBlockedAccounts(user.id),
          getReportHistory(user.id),
        ]);

        if (!active) return;
        setSettings(snapshot.privacySettings);
        setVerifiedPhoto(snapshot.verifiedPhoto);
        setBlocked(blockedRows);
        setReports(reportRows);
      } catch (error) {
        console.error("Error loading privacy settings:", error);
        Alert.alert(tx("app.settings.privacySafety.couldNotLoadSettings"), tx("app.settings.privacySafety.pleaseTryAgain"));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const settingsChannel = subscribeToSettings(user.id, (snapshot) => {
      setSettings(snapshot.privacySettings);
      setVerifiedPhoto(snapshot.verifiedPhoto);
    });
    const safetyChannel = subscribeToSafetyChanges(user.id, () => {
      void loadSafetyLists();
    });

    return () => {
      settingsChannel.unsubscribe();
      safetyChannel.unsubscribe();
    };
  }, [loadSafetyLists, user]);

  const setToggle = async (key: PrivacyKey, value: boolean) => {
    if (!user || !settings || savingKey) return;

    const previous = settings;
    setSettings({ ...settings, [key]: value });
    setSavingKey(key);

    try {
      const next = await updatePrivacySettings(user.id, { [key]: value });
      setSettings(next);
      await refreshProfile();
    } catch (error) {
      console.error("Error updating privacy setting:", error);
      setSettings(previous);
      Alert.alert(tx("app.settings.privacySafety.settingNotSaved"), tx("app.settings.privacySafety.pleaseTryAgain"));
    } finally {
      setSavingKey(null);
    }
  };

  const handleVerifyPhoto = async () => {
    if (!profile || verifiedPhoto) return;

    try {
      await verifyProfilePhoto(profile);
      setVerifiedPhoto(true);
      await refreshProfile();
      Alert.alert(tx("app.settings.privacySafety.photoVerified"), tx("app.settings.privacySafety.yourProfilePhotoIsMarkedVerified"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : tx("common.retry");
      Alert.alert(tx("app.settings.privacySafety.couldNotVerifyPhoto"), message);
    }
  };

  const handleUnblock = (account: BlockedAccount) => {
    if (!user) return;

    Alert.alert(tx("app.settings.privacySafety.unblockAccount"), tx("app.settings.privacySafety.value1WillBeAbleToInteractWithYouAgain", { value1: account.name }), [
      { text: tx("app.settings.privacySafety.cancel"), style: "cancel" },
      {
        text: tx("app.settings.privacySafety.unblock"),
        onPress: async () => {
          try {
            await unblockAccount(user.id, account.id);
            await loadSafetyLists();
          } catch (error) {
            console.error("Error unblocking account:", error);
            Alert.alert(tx("app.settings.privacySafety.couldNotUnblock"), tx("app.settings.privacySafety.pleaseTryAgain"));
          }
        },
      },
    ]);
  };

  const handleExportData = async () => {
    if (!user || exporting) return;

    setExporting(true);
    try {
      const data = await buildUserDataExport(user.id);
      const path = `${FileSystem.documentDirectory}sociol-data-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
      await Share.share({
        title: tx("privacy.dataExportTitle"),
        message: tx("privacy.dataExportReady", { path }),
        url: path,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert(tx("app.settings.privacySafety.exportFailed"), tx("app.settings.privacySafety.pleaseTryAgain"));
    } finally {
      setExporting(false);
    }
  };

  const renderVisibility = () => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{tx("app.settings.privacySafety.visibility")}</Text>
      <View style={styles.card}>
        {visibilityRows.map((row, index) => {
          const Icon = row.Icon;
          return (
            <View
              key={row.key}
              style={[
                styles.row,
                index < visibilityRows.length - 1 && styles.rowBorder,
              ]}
            >
              <View style={styles.rowIcon}>
                <Icon size={19} color={Colors.textPrimary} strokeWidth={2.1} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{tx(row.titleKey)}</Text>
                <Text style={styles.rowBody}>{tx(row.bodyKey)}</Text>
              </View>
              <Switch
                value={Boolean(settings?.[row.key])}
                disabled={!settings || savingKey === row.key}
                onValueChange={(value) => void setToggle(row.key, value)}
                trackColor={{ false: Colors.inputBg, true: Colors.primary }}
                thumbColor={Colors.textPrimary}
                ios_backgroundColor={Colors.inputBg}
              />
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.76}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.3} />
        </TouchableOpacity>
        <Text style={styles.title}>{tx("app.settings.privacySafety.privacySafety")}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.trustBanner}>
            <ShieldCheck size={22} color={Colors.textPrimary} strokeWidth={2.1} />
            <Text style={styles.trustText}>
              {tx("app.settings.privacySafety.sociolIsBuiltAroundSmallTrustedCirclesYouControl")}</Text>
          </View>

          {renderVisibility()}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{tx("app.settings.privacySafety.safety")}</Text>
            <View style={styles.card}>
              <ActionRow
                Icon={ShieldCheck}
                title={tx("app.settings.privacySafety.verifiedPhoto")}
                rightText={verifiedPhoto ? tx("privacy.verified") : tx("privacy.verify")}
                onPress={handleVerifyPhoto}
              />
              <ActionRow
                Icon={UserX}
                title={tx("app.settings.privacySafety.blockedAccounts")}
                rightText={String(blocked.length)}
                onPress={() => setBlockedVisible(true)}
              />
              <ActionRow
                Icon={Flag}
                title={tx("app.settings.privacySafety.reportHistory")}
                rightText={reports.length ? String(reports.length) : undefined}
                onPress={() => setReportsVisible(true)}
              />
              <ActionRow
                Icon={Download}
                title={exporting ? tx("app.settings.privacySafety.preparingData") : tx("app.settings.privacySafety.downloadMyData")}
                onPress={handleExportData}
              />
              <ActionRow
                Icon={Trash2}
                title={tx("app.settings.privacySafety.deleteAccount")}
                onPress={() => router.push("/settings/delete-account")}
                danger
                last
              />
            </View>
          </View>
        </ScrollView>
      )}

      <ListModal
        visible={blockedVisible}
        title={tx("app.settings.privacySafety.blockedAccounts")}
        onClose={() => setBlockedVisible(false)}
      >
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyText text={tx("app.settings.privacySafety.noBlockedAccounts")} />}
          renderItem={({ item }) => (
            <View style={styles.modalRow}>
              <Avatar uri={item.photoURL} size={42} />
              <View style={styles.modalCopy}>
                <Text style={styles.modalTitle}>{item.name}</Text>
                <Text style={styles.modalBody}>
                  {tx("privacy.blockedOn", { date: formatLocalizedDate(item.blockedAt) })}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.76}
                style={styles.smallButton}
                onPress={() => handleUnblock(item)}
              >
                <Text style={styles.smallButtonText}>{tx("app.settings.privacySafety.unblock")}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </ListModal>

      <ListModal
        visible={reportsVisible}
        title={tx("app.settings.privacySafety.reportHistory")}
        onClose={() => setReportsVisible(false)}
      >
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyText text={tx("app.settings.privacySafety.noReportsSubmitted")} />}
          renderItem={({ item }) => (
            <View style={styles.modalRow}>
              <View style={styles.modalIcon}>
                <Flag size={18} color={Colors.textPrimary} strokeWidth={2.1} />
              </View>
              <View style={styles.modalCopy}>
                <Text style={styles.modalTitle}>{item.reason}</Text>
                <Text style={styles.modalBody}>
                  {optionLabel(item.status)} · {formatLocalizedDate(item.createdAt)}
                </Text>
              </View>
            </View>
          )}
        />
      </ListModal>
    </SafeAreaView>
  );
}

function ActionRow({
  Icon,
  title,
  rightText,
  onPress,
  last = false,
  danger = false,
}: {
  Icon: LucideIcon;
  title: string;
  rightText?: string;
  onPress: () => void;
  last?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.76}
      style={[styles.actionRow, !last && styles.rowBorder]}
      onPress={onPress}
    >
      <Icon
        size={19}
        color={danger ? Colors.danger : Colors.textPrimary}
        strokeWidth={2.1}
      />
      <Text style={[styles.actionTitle, danger && styles.actionTitleDanger]}>
        {title}
      </Text>
      {rightText ? <Text style={styles.actionRight}>{rightText}</Text> : null}
      <ChevronRight size={18} color={Colors.textSecondary} strokeWidth={2.1} />
    </TouchableOpacity>
  );
}

function ListModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.76}
            style={styles.backButton}
            onPress={onClose}
          >
            <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.3} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.modalContent}>{children}</View>
      </SafeAreaView>
    </Modal>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.rowBody}>{text}</Text>
    </View>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenPadding,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...Typography.h3,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  trustBanner: {
    flexDirection: "row",
    gap: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  trustText: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
  },
  row: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  rowBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  actionTitle: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  actionTitleDanger: {
    color: Colors.danger,
  },
  actionRight: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  modalRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  modalIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCopy: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  smallButton: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  smallButtonText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  emptyWrap: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
}));
