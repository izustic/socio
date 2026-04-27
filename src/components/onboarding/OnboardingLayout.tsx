import Button from '@/src/components/ui/Button';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  stepLabel?: string;
  stepNumber?: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  onBackPress?: () => void;
  children: React.ReactNode;
  scrollable?: boolean;
  centerContent?: boolean;
}

export default function OnboardingLayout({
  title,
  subtitle,
  stepLabel,
  stepNumber,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
  secondaryLabel,
  onSecondaryPress,
  onBackPress,
  children,
  scrollable = true,
  centerContent = false,
}: OnboardingLayoutProps) {
  const body = (
    <View style={[styles.content, centerContent && styles.centerContent]}>
      {(stepLabel || stepNumber) && (
        <View style={styles.stepRow}>
          <View style={styles.stepAccent} />
          {stepLabel ? <Text style={styles.stepLabel}>{stepLabel}</Text> : null}
          {stepNumber ? <Text style={styles.stepNumber}>{stepNumber}</Text> : null}
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.children}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {onBackPress ? (
          <View style={styles.topBar}>
            <TouchableOpacity activeOpacity={0.7} onPress={onBackPress} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.topSpacer} />
        )}

        {scrollable ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}

        {(primaryLabel || secondaryLabel) && (
          <View style={styles.footer}>
            {primaryLabel && onPrimaryPress ? (
              <Button
                title={primaryLabel}
                onPress={onPrimaryPress}
                disabled={primaryDisabled}
              />
            ) : null}
            {secondaryLabel && onSecondaryPress ? (
              <TouchableOpacity activeOpacity={0.7} onPress={onSecondaryPress} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>{secondaryLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xs,
  },
  topSpacer: {
    height: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: '#F7F4EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  content: {
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  stepAccent: {
    width: 44,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    ...Typography.label,
  },
  stepNumber: {
    ...Typography.bodySmall,
  },
  title: {
    ...Typography.h1,
    fontSize: 38,
    lineHeight: 40,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    maxWidth: 320,
  },
  children: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
