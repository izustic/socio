import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { Colors, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotificationsPermissionScreen() {
  const { mergeDraft, setStep } = useOnboarding();

  const goNext = (enabled: boolean) => {
    mergeDraft({ notificationsEnabled: enabled });
    setStep('onboarding-intro');
    router.replace('/onboarding-intro');
  };

  return (
    <OnboardingLayout
      title={"Don't miss a beat"}
      subtitle={"We'll let you know when your Circle grows, someone accepts, or it's time to meet."}
      stepNumber="04  NOTIFICATIONS PERMISSION"
      primaryLabel="Allow Notifications"
      onPrimaryPress={() => goNext(true)}
      secondaryLabel="Not now"
      onSecondaryPress={() => goNext(false)}
      centerContent
    >
      <View style={styles.card}>
        <Text style={styles.cardIcon}>🔔</Text>
        <View style={styles.cardBubble}>
          <Text style={styles.cardTitle}>Someone joined your Circle!</Text>
          <Text style={styles.cardBody}>Time to say hey.</Text>
        </View>
      </View>
      <Text style={styles.note}>You can change this in your phone settings later.</Text>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  cardIcon: {
    fontSize: 30,
    marginBottom: Spacing.md,
  },
  cardBubble: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    minWidth: 220,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  cardBody: {
    ...Typography.bodySmall,
    marginTop: 4,
  },
  note: {
    ...Typography.bodySmall,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
