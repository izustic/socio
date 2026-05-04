import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { getLocationWithCity, requestLocationPermission } from '@/src/services/location';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function LocationPermissionScreen() {
  const { mergeDraft, setStep } = useOnboarding();

  const continueToNotifications = () => {
    setStep('notifications-permission');
  };

  const handleEnableLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert(
        'Location turned off',
        'You can keep going for now, but circles nearby work better when location is enabled.'
      );
      mergeDraft({ locationEnabled: false, location: null });
      continueToNotifications();
      return;
    }

    const location = await getLocationWithCity();
    mergeDraft({
      locationEnabled: true,
      location,
    });
    continueToNotifications();
  };

  return (
    <OnboardingLayout
      title="Can we find your people?"
      subtitle="We use your location to show you people nearby. We never share it publicly."
      stepNumber="03  LOCATION PERMISSION"
      primaryLabel="Set Location Services"
      onPrimaryPress={handleEnableLocation}
      secondaryLabel="Maybe later"
      onSecondaryPress={continueToNotifications}
      onBackPress={() => setStep('otp')}
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
