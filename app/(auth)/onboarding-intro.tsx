import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import Chip from '@/src/components/ui/Chip';
import { Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function OnboardingIntroScreen() {
  const { setStep } = useOnboarding();

  return (
    <OnboardingLayout
      title={"Let's build your vibe."}
      subtitle={"We're going to ask you a few quick things. Your name. Your interests. What kind of people you're looking for. No pressure, just enough to find the right Circle for you."}
      stepNumber="05  ONBOARDING INTRO"
      primaryLabel={"Let's do it"}
      onPrimaryPress={() => {
        setStep('profile-photo-name');
        router.replace('/profile-photo-name');
      }}
      onBackPress={() => router.back()}
      centerContent
    >
      <View style={styles.hero}>
        <Text style={styles.wordmark}>socio</Text>
      </View>
      <View style={styles.chips}>
        <Chip label="📸 Photo" selected />
        <Chip label="🏷️ Name" selected />
        <Chip label="💛 Interests" selected />
        <Chip label="✨ Traits" selected />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 156,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    backgroundColor: '#F9BB19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    ...Typography.h2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
