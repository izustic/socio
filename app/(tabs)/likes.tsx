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
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";

type PlanRow = {
  feature: string;
  free: string;
  socio: string;
  socioIcon?: LucideIcon;
};

type Benefit = {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
};

const PLAN_ROWS: PlanRow[] = [
  { feature: "Circle size", free: "5", socio: "8" },
  { feature: "Filters", free: "Basic", socio: "All" },
  { feature: "Daily swipes", free: "20", socio: "∞" },
  { feature: "Circle extensions", free: "1", socio: "∞" },
  { feature: "Backtracks", free: "-", socio: "∞" },
  { feature: "Spotlight", free: "-", socio: "2x/wk" },
  { feature: "See who liked you", free: "Count", socio: "Full" },
];

const BENEFITS: Benefit[] = [
  {
    title: "Bigger Circles",
    subtitle: "Up to 8 members instead of 5",
    Icon: Users,
  },
  {
    title: "All filters",
    subtitle: "Traits, education, recently active",
    Icon: SlidersHorizontal,
  },
  {
    title: "Unlimited swipes",
    subtitle: "No daily cap",
    Icon: Infinity,
  },
  {
    title: "Unlimited extensions",
    subtitle: "Keep your Circle alive",
    Icon: Clock,
  },
  {
    title: "Unlimited backtracks",
    subtitle: "Undo any swipe",
    Icon: RotateCcw,
  },
  {
    title: "Spotlight",
    subtitle: "2x per week",
    Icon: Zap,
  },
  {
    title: "See who liked you",
    subtitle: "Full names and photos",
    Icon: Eye,
  },
  {
    title: "Premium badge",
    subtitle: "Stand out on your profile",
    Icon: BadgeCheck,
  },
  {
    title: "Circle analytics",
    subtitle: "Host insights",
    Icon: BarChart3,
  },
];

export default function LikesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topRow}>
          <Text style={styles.screenTitle}>Likes</Text>
          <View style={styles.plusPill}>
            <Sparkles size={15} color={Colors.textPrimary} strokeWidth={2.3} />
            <Text style={styles.plusText}>SOCIO+</Text>
          </View>
        </View>

        <View style={styles.heroIcon}>
          <LockKeyhole size={28} color={Colors.textPrimary} strokeWidth={2.3} />
        </View>
        <Text style={styles.kicker}>COMING SOON</Text>
        <Text style={styles.title}>Free vs Socio+</Text>
        <Text style={styles.subtitle}>Everything in Free, plus a lot more.</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderText, styles.featureCell]}>FEATURE</Text>
            <Text style={[styles.tableHeaderText, styles.valueCell]}>FREE</Text>
            <View style={[styles.socioHeaderCell, styles.valueCell]}>
              <Sparkles size={15} color={Colors.textPrimary} strokeWidth={2.2} />
              <Text style={styles.socioHeaderText}>SOCIO+</Text>
            </View>
          </View>

          {PLAN_ROWS.map((row) => (
            <View key={row.feature} style={styles.tableRow}>
              <Text style={styles.featureText}>{row.feature}</Text>
              <Text style={styles.freeText}>{row.free}</Text>
              <Text style={styles.socioText}>{row.socio}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <Sparkles size={22} color={Colors.textPrimary} strokeWidth={2.3} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>Billing is being set up</Text>
            <Text style={styles.noticeText}>
              Socio+ purchases will open after App Store and Google Play products
              are ready.
            </Text>
          </View>
        </View>

        <View style={styles.benefitGrid}>
          {BENEFITS.map(({ title, subtitle, Icon }) => (
            <View key={title} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Icon size={21} color={Colors.textPrimary} strokeWidth={2.2} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{title}</Text>
                <Text style={styles.benefitText}>{subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: Colors.white,
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
});
