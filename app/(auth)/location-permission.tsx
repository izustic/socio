import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { getLocationWithCity, requestLocationPermissionStatus } from '@/src/services/location';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

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
            'Location is blocked',
            'Location permission was already denied for Socio. Open your device settings to allow location access, or continue without it for now.',
            [
              {
                text: 'Continue without it',
                style: 'cancel',
                onPress: () => {
                  mergeDraft({ locationEnabled: false, locationPermissionResolved: true, location: null });
                  continueToNotifications();
                },
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
          'Location turned off',
          'You can keep going for now, but circles nearby work better when location is enabled.'
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
      title="Can we find your people?"
      subtitle="We use your location to show you people nearby. We never share it publicly."
      stepNumber="03  LOCATION PERMISSION"
      primaryLabel="Set Location Services"
      onPrimaryPress={handleEnableLocation}
      primaryLoading={isSettingLocation}
      primaryDisabled={isSettingLocation}
      secondaryLabel="Maybe later"
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
      <Text style={styles.note}>You can update this anytime in settings.</Text>
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
