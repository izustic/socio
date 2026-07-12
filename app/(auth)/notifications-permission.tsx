import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { Colors, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { requestNotificationPermissionStatus } from '@/src/services/notificationPermission';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { tx } from "@/src/utils/localization";

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
            tx("app.auth.notificationsPermission.notificationsAreBlocked"),
            tx("app.auth.notificationsPermission.notificationPermissionWasAlreadyDeniedForSociolOpenYour"),
            [
              {
                text: tx("app.auth.notificationsPermission.continueWithoutThem"),
                style: 'cancel',
                onPress: () => continueToIntro(false),
              },
              {
                text: tx("app.auth.notificationsPermission.openSettings"),
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }

        Alert.alert(
          tx("app.auth.notificationsPermission.notificationsTurnedOff"),
          tx("app.auth.notificationsPermission.youCanKeepGoingForNowButYouMay")
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
      title={tx("app.auth.notificationsPermission.donTMissABeat")}
      subtitle={tx("app.auth.notificationsPermission.weLlLetYouKnowWhenYourCircleGrows")}
      stepNumber={tx("onboarding.step.notifications")}
      primaryLabel={tx("app.auth.notificationsPermission.allowNotifications")}
      onPrimaryPress={handleAllowNotifications}
      primaryLoading={isRequestingPermission}
      primaryDisabled={isRequestingPermission}
      secondaryLabel={tx("app.auth.notificationsPermission.notNow")}
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
          <Text style={styles.cardTitle}>{tx("app.auth.notificationsPermission.someoneJoinedYourCircle")}</Text>
          <Text style={styles.cardBody}>{tx("app.auth.notificationsPermission.timeToSayHey")}</Text>
        </View>
      </View>
      <Text style={styles.note}>{tx("app.auth.notificationsPermission.youCanChangeThisInYourPhoneSettingsLater")}</Text>
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
