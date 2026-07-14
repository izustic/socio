import { SafeAreaView } from "react-native-safe-area-context";
import {
  BadgeCheck,
  BarChart3,
  Clock,
  Eye,
  Infinity,
  LockKeyhole,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Users,
  Zap,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { createThemedStyles, Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { tx } from "@/src/utils/localization";

type PlanRow = {
  featureKey: string;
  free: string;
  socio: string;
  socioIcon?: LucideIcon;
};

type Benefit = {
  titleKey: string;
  subtitleKey: string;
  Icon: LucideIcon;
};

const PLAN_ROWS: PlanRow[] = [
  { featureKey: "plans.circleSize", free: "5", socio: "8" },
  { featureKey: "plans.filters", free: "plans.basic", socio: "plans.all" },
  { featureKey: "plans.dailySwipes", free: "20", socio: "∞" },
  { featureKey: "plans.circleExtensions", free: "1", socio: "∞" },
  { featureKey: "plans.backtracks", free: "-", socio: "∞" },
  { featureKey: "plans.spotlight", free: "-", socio: "plans.twiceWeekly" },
  { featureKey: "plans.seeWhoLikedYou", free: "plans.count", socio: "plans.full" },
];

const BENEFITS: Benefit[] = [
  {
    titleKey: "plans.biggerCircles",
    subtitleKey: "plans.biggerCirclesDescription",
    Icon: Users,
  },
  {
    titleKey: "plans.allFilters",
    subtitleKey: "plans.allFiltersDescription",
    Icon: SlidersHorizontal,
  },
  {
    titleKey: "plans.unlimitedSwipes",
    subtitleKey: "plans.unlimitedSwipesDescription",
    Icon: Infinity,
  },
  {
    titleKey: "plans.unlimitedExtensions",
    subtitleKey: "plans.unlimitedExtensionsDescription",
    Icon: Clock,
  },
  {
    titleKey: "plans.unlimitedBacktracks",
    subtitleKey: "plans.unlimitedBacktracksDescription",
    Icon: RotateCcw,
  },
  {
    titleKey: "plans.spotlight",
    subtitleKey: "plans.twicePerWeek",
    Icon: Zap,
  },
  {
    titleKey: "plans.seeWhoLikedYou",
    subtitleKey: "plans.seeWhoLikedYouDescription",
    Icon: Eye,
  },
  {
    titleKey: "plans.premiumBadge",
    subtitleKey: "plans.premiumBadgeDescription",
    Icon: BadgeCheck,
  },
  {
    titleKey: "plans.circleAnalytics",
    subtitleKey: "plans.circleAnalyticsDescription",
    Icon: BarChart3,
  },
];

export default function LikesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topRow}>
          <Text style={styles.screenTitle}>{tx("app.tabs.likes.likes")}</Text>
          <View style={styles.plusPill}>
            <Sparkles size={15} color={Colors.textPrimary} strokeWidth={2.3} />
            <Text style={styles.plusText}>{tx("app.tabs.likes.sociol")}</Text>
          </View>
        </View>

        <View style={styles.heroIcon}>
          <LockKeyhole size={28} color={Colors.textPrimary} strokeWidth={2.3} />
        </View>
        <Text style={styles.kicker}>{tx("app.tabs.likes.comingSoon")}</Text>
        <Text style={styles.title}>{tx("app.tabs.likes.freeVsSociol")}</Text>
        <Text style={styles.subtitle}>{tx("app.tabs.likes.everythingInFreePlusALotMore")}</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderText, styles.featureCell]}>{tx("app.tabs.likes.feature")}</Text>
            <Text style={[styles.tableHeaderText, styles.valueCell]}>{tx("app.tabs.likes.free")}</Text>
            <View style={[styles.socioHeaderCell, styles.valueCell]}>
              <Sparkles size={15} color={Colors.textPrimary} strokeWidth={2.2} />
              <Text style={styles.socioHeaderText}>{tx("app.tabs.likes.sociol")}</Text>
            </View>
          </View>

          {PLAN_ROWS.map((row) => (
            <View key={row.featureKey} style={styles.tableRow}>
              <Text style={styles.featureText}>{tx(row.featureKey)}</Text>
              <Text style={styles.freeText}>{row.free.startsWith("plans.") ? tx(row.free) : row.free}</Text>
              <Text style={styles.socioText}>{row.socio.startsWith("plans.") ? tx(row.socio) : row.socio}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <Sparkles size={22} color={Colors.textPrimary} strokeWidth={2.3} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>{tx("app.tabs.likes.billingIsBeingSetUp")}</Text>
            <Text style={styles.noticeText}>
              {tx("app.tabs.likes.sociolPurchasesWillOpenAfterAppStoreAndGoogle")}</Text>
          </View>
        </View>

        <View style={styles.benefitGrid}>
          {BENEFITS.map(({ titleKey, subtitleKey, Icon }) => (
            <View key={titleKey} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Icon size={21} color={Colors.textPrimary} strokeWidth={2.2} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{tx(titleKey)}</Text>
                <Text style={styles.benefitText}>{tx(subtitleKey)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 18,
    paddingBottom: 120,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  screenTitle: {
    ...Typography.h2,
    fontSize: 26,
    lineHeight: 32,
  },
  plusPill: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  plusText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  kicker: {
    ...Typography.label,
    color: Colors.primaryDark,
    fontWeight: "900",
    marginBottom: 10,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
    lineHeight: 40,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    marginBottom: 28,
  },
  table: {
    borderRadius: 20,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
    paddingHorizontal: 20,
  },
  tableHeader: {
    minHeight: 54,
  },
  tableHeaderText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: "900",
  },
  featureCell: {
    flex: 1.55,
  },
  valueCell: {
    flex: 0.78,
    textAlign: "center",
  },
  socioHeaderCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  socioHeaderText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "900",
  },
  featureText: {
    ...Typography.body,
    flex: 1.55,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  freeText: {
    ...Typography.body,
    flex: 0.78,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  socioText: {
    ...Typography.body,
    flex: 0.78,
    color: Colors.textPrimary,
    textAlign: "center",
    fontWeight: "900",
  },
  noticeCard: {
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 14,
    marginBottom: 22,
  },
  noticeIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "900",
  },
  noticeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  benefitGrid: {
    gap: 12,
  },
  benefitCard: {
    minHeight: 76,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 13,
  },
  benefitIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitCopy: {
    flex: 1,
  },
  benefitTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "900",
  },
  benefitText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
}));
