import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { Colors, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { requestNotificationPermissionStatus } from '@/src/services/notificationPermission';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

export default function NotificationsPermissionScreen() {
  const { mergeDraft, setStep } = useOnboarding();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const continueToIntro = (enabled: boolean) => {
    mergeDraft({
      notificationsEnabled: enabled,
      notificationsPermissionResolved: true,
    });
    setStep('onboarding-intro');
  };

  const handleAllowNotifications = async () => {
    if (isRequestingPermission) return;

    setIsRequestingPermission(true);
    try {
      const permission = await requestNotificationPermissionStatus();
      if (permission.status !== 'granted') {
        if (!permission.canAskAgain) {
          Alert.alert(
            'Notifications are blocked',
            'Notification permission was already denied for Sociol. Open your device settings to allow notifications, or continue without them for now.',
            [
              {
                text: 'Continue without them',
                style: 'cancel',
                onPress: () => continueToIntro(false),
              },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }

        Alert.alert(
          'Notifications turned off',
          'You can keep going for now, but you may miss updates when your Circle grows or it is time to meet.'
        );
        continueToIntro(false);
        return;
      }

      continueToIntro(true);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <OnboardingLayout
      title={"Don't miss a beat"}
      subtitle={"We'll let you know when your Circle grows, someone accepts, or it's time to meet."}
      stepNumber="04  NOTIFICATIONS PERMISSION"
      primaryLabel="Allow Notifications"
      onPrimaryPress={handleAllowNotifications}
      primaryLoading={isRequestingPermission}
      primaryDisabled={isRequestingPermission}
      secondaryLabel="Not now"
      onSecondaryPress={() => {
        if (isRequestingPermission) return;
        continueToIntro(false);
      }}
      onBackPress={() => {
        if (isRequestingPermission) return;
        setStep('location-permission');
      }}
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
