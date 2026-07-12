import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { getLocationWithCity, requestLocationPermissionStatus } from '@/src/services/location';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { tx } from "@/src/utils/localization";

export default function LocationPermissionScreen() {
  const { mergeDraft, setStep } = useOnboarding();
  const [isSettingLocation, setIsSettingLocation] = useState(false);

  const continueToNotifications = () => {
    setStep('notifications-permission');
  };

  const handleEnableLocation = async () => {
    if (isSettingLocation) return;

    setIsSettingLocation(true);
    try {
      const permission = await requestLocationPermissionStatus();
      if (permission.status !== 'granted') {
        if (!permission.canAskAgain) {
          Alert.alert(
            tx("app.auth.locationPermission.locationIsBlocked"),
            tx("app.auth.locationPermission.locationPermissionWasAlreadyDeniedForSociolOpenYour"),
            [
              {
                text: tx("app.auth.locationPermission.continueWithoutIt"),
                style: 'cancel',
                onPress: () => {
                  mergeDraft({ locationEnabled: false, locationPermissionResolved: true, location: null });
                  continueToNotifications();
                },
              },
              {
                text: tx("app.auth.locationPermission.openSettings"),
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }

        Alert.alert(
          tx("app.auth.locationPermission.locationTurnedOff"),
          tx("app.auth.locationPermission.youCanKeepGoingForNowButCirclesNearby")
        );
        mergeDraft({ locationEnabled: false, locationPermissionResolved: true, location: null });
        continueToNotifications();
        return;
      }

      const location = await getLocationWithCity();
      mergeDraft({
        locationEnabled: true,
        locationPermissionResolved: true,
        location,
      });
      continueToNotifications();
    } finally {
      setIsSettingLocation(false);
    }
  };

  return (
    <OnboardingLayout
      title={tx("app.auth.locationPermission.canWeFindYourPeople")}
      subtitle={tx("app.auth.locationPermission.weUseYourLocationToShowYouPeopleNearby")}
      stepNumber={tx("onboarding.step.location")}
      primaryLabel={tx("app.auth.locationPermission.setLocationServices")}
      onPrimaryPress={handleEnableLocation}
      primaryLoading={isSettingLocation}
      primaryDisabled={isSettingLocation}
      secondaryLabel={tx("app.auth.locationPermission.maybeLater")}
      onSecondaryPress={() => {
        if (isSettingLocation) return;
        mergeDraft({ locationEnabled: false, locationPermissionResolved: true, location: null });
        continueToNotifications();
      }}
      onBackPress={() => {
        if (isSettingLocation) return;
        setStep('otp');
      }}
      centerContent
    >
      <View style={styles.ringWrap}>
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            <View style={styles.ringDot} />
          </View>
        </View>
      </View>
      <Text style={styles.note}>{tx("app.auth.locationPermission.youCanUpdateThisAnytimeInSettings")}</Text>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  ringWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ringOuter: {
    width: 132,
    height: 132,
    borderRadius: Radius.full,
    backgroundColor: '#FBF4DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDot: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
  },
  note: {
    ...Typography.bodySmall,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
