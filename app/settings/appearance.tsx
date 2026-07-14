import { SafeAreaView } from "react-native-safe-area-context";
import { createThemedStyles, Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useLocale } from "@/src/providers/LocaleProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { LanguagePreference } from "@/src/services/LocalizationService";
import { ThemePreference } from "@/src/services/ThemeService";
import { goBackOrReplace } from "@/src/utils/navigation";
import { Check, ChevronLeft, Languages, Moon, Sun } from "lucide-react-native";
import React from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

const languageOptions: { value: LanguagePreference; labelKey: string }[] = [
  { value: "system", labelKey: "common.system" },
  { value: "en", labelKey: "common.english" },
  { value: "fr", labelKey: "common.french" },
  { value: "es", labelKey: "common.spanish" },
  { value: "pt", labelKey: "common.portuguese" },
  { value: "de", labelKey: "common.german" },
  { value: "ar", labelKey: "common.arabic" },
];

const themeOptions: { value: ThemePreference; labelKey: string }[] = [
  { value: "system", labelKey: "settings.theme.system" },
  { value: "light", labelKey: "settings.theme.light" },
  { value: "dark", labelKey: "settings.theme.dark" },
];

export default function AppearanceSettingsScreen() {
  const {
    t,
    languagePreference,
    language,
    locale,
    region,
    isRTL,
    setLanguagePreference,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
  } = useLocale();
  const { preference, colorScheme, setThemePreference } = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.76}
          style={styles.backButton}
          onPress={() => goBackOrReplace("/(tabs)/profile")}
          accessibilityLabel={t("common.back")}
        >
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.3} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("settings.appearanceLanguage")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection
          icon={<Languages size={18} color={Colors.textPrimary} strokeWidth={2.1} />}
          title={t("settings.language")}
          description={t("settings.languageDescription")}
        >
          {languageOptions.map((option) => (
            <OptionRow
              key={option.value}
              label={t(option.labelKey)}
              selected={languagePreference === option.value}
              onPress={() => void setLanguagePreference(option.value)}
            />
          ))}
        </SettingsSection>

        <SettingsSection
          icon={colorScheme === "dark" ? <Moon size={18} color={Colors.textPrimary} /> : <Sun size={18} color={Colors.textPrimary} />}
          title={t("settings.appearance")}
          description={t("settings.appearanceDescription")}
        >
          {themeOptions.map((option) => (
            <OptionRow
              key={option.value}
              label={t(option.labelKey)}
              selected={preference === option.value}
              onPress={() => void setThemePreference(option.value)}
            />
          ))}
        </SettingsSection>

        <SettingsSection
          title={t("settings.region")}
          description={t("settings.regionDescription")}
        >
          <InfoRow label={t("settings.country")} value={region.country} />
          <InfoRow label={t("settings.locale")} value={`${locale} (${language})`} />
          <InfoRow label={t("settings.currency")} value={`${region.currency} · ${formatCurrency(9.99)}`} />
          <InfoRow label={t("settings.timezone")} value={region.timezone} />
          <InfoRow label={t("settings.textDirection")} value={isRTL ? t("settings.rtl") : t("settings.ltr")} />
          <InfoRow label={t("settings.dateExample")} value={formatDate(new Date(2026, 6, 9))} />
          <InfoRow label={t("settings.timeExample")} value={formatTime(new Date(2026, 6, 9, 15, 30))} />
          <InfoRow label={t("settings.numberExample")} value={formatNumber(123456.78)} />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? <View style={styles.sectionIcon}>{icon}</View> : null}
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.74}
      style={styles.optionRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={styles.optionText}>{label}</Text>
      {selected ? <Check size={19} color={Colors.primaryDark} strokeWidth={2.4} /> : null}
    </TouchableOpacity>
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
    flex: 1,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCopy: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
  },
  optionRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
  },
  optionText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  infoRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  infoLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.body,
    flex: 1,
    textAlign: "right",
    color: Colors.textPrimary,
  },
}));
