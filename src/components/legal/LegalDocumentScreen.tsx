import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { LegalDocument } from "@/src/constants/legal";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LegalDocumentScreen({
  document,
}: {
  document: LegalDocument;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.76}
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{document.title}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{document.eyebrow}</Text>
          <Text style={styles.title}>{document.title}</Text>
          <Text style={styles.summary}>{document.summary}</Text>
          <Text style={styles.updated}>Last updated {document.updatedAt}</Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            This page is provided for transparency and should be reviewed by
            counsel before public launch.
          </Text>
        </View>

        <View style={styles.sections}>
          {document.sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.body.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
              {section.bullets ? (
                <View style={styles.bullets}>
                  {section.bullets.map((bullet) => (
                    <View key={bullet} style={styles.bulletRow}>
                      <Text style={styles.bulletMarker}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
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
  headerTitle: {
    ...Typography.h3,
    flex: 1,
    fontSize: 21,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 120,
  },
  hero: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  eyebrow: {
    ...Typography.label,
    color: Colors.primaryDark,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    fontSize: 34,
    lineHeight: 39,
  },
  summary: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontSize: 17,
    lineHeight: 25,
  },
  updated: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: "700",
  },
  notice: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noticeText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  sections: {
    gap: Spacing.md,
  },
  section: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  bullets: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  bulletMarker: {
    ...Typography.body,
    color: Colors.primaryDark,
    fontWeight: "900",
    lineHeight: 22,
  },
  bulletText: {
    ...Typography.body,
    flex: 1,
    color: Colors.textSecondary,
  },
});
