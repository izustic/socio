import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useLocale } from "@/src/providers/LocaleProvider";
import {
  getSettingsSnapshot,
  NotificationSettings,
  subscribeToSettings,
  updateNotificationSettings,
  } from "@/src/services/settings";
import { goBackOrReplace } from "@/src/utils/navigation";
import {
  Bell,
  ChevronLeft,
  Heart,
  Mail,
  Moon,
  Sparkles,
  Users,
  } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import React,
  { useEffect,
  useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NotificationKey = keyof Pick<
  NotificationSettings,
  | "circleActivity"
  | "newMessages"
  | "mutualMatches"
  | "suggestions"
  | "productUpdates"
  | "quietHours"
>;

const rows: {
  group: "circle" | "general";
  key: NotificationKey;
  titleKey: string;
  bodyKey: string;
  Icon: LucideIcon;
}[] = [
  {
    group: "circle",
    key: "circleActivity",
    titleKey: "notifications.circleActivity.title",
    bodyKey: "notifications.circleActivity.body",
    Icon: Users,
  },
  {
    group: "circle",
    key: "newMessages",
    titleKey: "notifications.newMessages.title",
    bodyKey: "notifications.newMessages.body",
    Icon: Bell,
  },
  {
    group: "circle",
    key: "mutualMatches",
    titleKey: "notifications.mutualMatches.title",
    bodyKey: "notifications.mutualMatches.body",
    Icon: Heart,
  },
  {
    group: "general",
    key: "suggestions",
    titleKey: "notifications.suggestions.title",
    bodyKey: "notifications.suggestions.body",
    Icon: Sparkles,
  },
  {
    group: "general",
    key: "productUpdates",
    titleKey: "notifications.productUpdates.title",
    bodyKey: "notifications.productUpdates.body",
    Icon: Mail,
  },
  {
    group: "general",
    key: "quietHours",
    titleKey: "notifications.quietHours.title",
    bodyKey: "notifications.quietHours.body",
    Icon: Moon,
  },
];

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [savingKey, setSavingKey] = useState<NotificationKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) return;

      try {
        const snapshot = await getSettingsSnapshot(user.id);
        if (active) setSettings(snapshot.notificationSettings);
      } catch (error) {
        console.error("Error loading notification settings:", error);
        Alert.alert(t("notifications.loadError.title"), t("common.retry"));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [t, user]);

  useEffect(() => {
    if (!user) return;

    const channel = subscribeToSettings(user.id, (snapshot) => {
      setSettings(snapshot.notificationSettings);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const setToggle = async (key: NotificationKey, value: boolean) => {
    if (!user || !settings || savingKey) return;

    const previous = settings;
    setSettings({ ...settings, [key]: value });
    setSavingKey(key);

    try {
      const next = await updateNotificationSettings(user.id, { [key]: value });
      setSettings(next);
    } catch (error) {
      console.error("Error updating notification setting:", error);
      setSettings(previous);
      Alert.alert(t("notifications.saveError.title"), t("common.retry"));
    } finally {
      setSavingKey(null);
    }
  };

  const renderGroup = (group: "circle" | "general") => (
    <View style={styles.section} key={group}>
      <Text style={styles.sectionLabel}>
        {group === "circle" ? t("notifications.groupCircle") : t("notifications.groupGeneral")}
      </Text>
      <View style={styles.card}>
        {rows
          .filter((row) => row.group === group)
          .map((row, index, groupRows) => {
            const Icon = row.Icon;
            return (
              <View
                key={row.key}
                style={[
                  styles.row,
                  index < groupRows.length - 1 && styles.rowBorder,
                ]}
              >
                <View style={styles.rowIcon}>
                  <Icon
                    size={19}
                    color={Colors.textPrimary}
                    strokeWidth={2.1}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{t(row.titleKey)}</Text>
                  <Text style={styles.rowBody}>{t(row.bodyKey)}</Text>
                </View>
                <Switch
                  value={Boolean(settings?.[row.key])}
                  disabled={!settings || savingKey === row.key}
                  onValueChange={(value) => void setToggle(row.key, value)}
                  trackColor={{ false: Colors.white, true: Colors.primary }}
                  thumbColor={Colors.textPrimary}
                  ios_backgroundColor={Colors.white}
                  accessibilityLabel={t(row.titleKey)}
                />
              </View>
            );
          })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.76}
          style={styles.backButton}
          onPress={() => goBackOrReplace("/(tabs)/profile")}
        >
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.3} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("notifications.settingsTitle")}</Text>
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
          <Text style={styles.description}>
            {t("notifications.description")}
          </Text>
          {renderGroup("circle")}
          {renderGroup("general")}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
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
    backgroundColor: Colors.white,
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
});
