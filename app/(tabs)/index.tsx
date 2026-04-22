import Button from '@/src/components/ui/Button';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Hey, Friend 👋</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.circleName}>Weekend Foodies</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3/5 members</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.ctaWrap}>
          <Button title="Continue Swiping" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
  },
  headerRow: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
  },
  card: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  circleName: {
    ...Typography.h3,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  ctaWrap: {
    marginTop: Spacing.sm,
  },
});
