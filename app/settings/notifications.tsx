import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  getSettingsSnapshot,
  NotificationSettings,
  subscribeToSettings,
  updateNotificationSettings,
  } from "@/src/services/settings";
import { router } from "expo-router";
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
  group: "Your Circle" | "General";
  key: NotificationKey;
  title: string;
  body: string;
  Icon: LucideIcon;
}[] = [
  {
    group: "Your Circle",
    key: "circleActivity",
    title: "Circle activity",
    body: "Joins, swipes back, when your Circle fills.",
    Icon: Users,
  },
  {
    group: "Your Circle",
    key: "newMessages",
    title: "New messages",
    body: "Chats inside your Circle.",
    Icon: Bell,
  },
  {
    group: "Your Circle",
    key: "mutualMatches",
    title: "Mutual matches",
    body: "When someone swipes you back.",
    Icon: Heart,
  },
  {
    group: "General",
    key: "suggestions",
    title: "Suggestions for you",
    body: "New people and Circles near you.",
    Icon: Sparkles,
  },
  {
    group: "General",
    key: "productUpdates",
    title: "Product updates",
    body: "Occasional emails about new features.",
    Icon: Mail,
  },
  {
    group: "General",
    key: "quietHours",
    title: "Quiet hours",
    body: "Silence everything from 10pm - 8am.",
    Icon: Moon,
  },
];

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
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
        Alert.alert("Could not load settings", "Please try again.");
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
      Alert.alert("Setting not saved", "Please try again.");
    } finally {
      setSavingKey(null);
    }
  };

  const renderGroup = (group: "Your Circle" | "General") => (
    <View style={styles.section} key={group}>
      <Text style={styles.sectionLabel}>{group}</Text>
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
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <Text style={styles.rowBody}>{row.body}</Text>
                </View>
                <Switch
                  value={Boolean(settings?.[row.key])}
                  disabled={!settings || savingKey === row.key}
                  onValueChange={(value) => void setToggle(row.key, value)}
                  trackColor={{ false: Colors.white, true: Colors.primary }}
                  thumbColor={Colors.textPrimary}
                  ios_backgroundColor={Colors.white}
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
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.3} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
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
            Choose what reaches you. We keep it quiet by default.
          </Text>
          {renderGroup("Your Circle")}
          {renderGroup("General")}
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
