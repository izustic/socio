import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { createThemedStyles, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { Text, View } from 'react-native';
import { tx } from "@/src/utils/localization";

export default function OnboardingIntroScreen() {
  const { setStep } = useOnboarding();

  return (
    <OnboardingLayout
      title={tx("app.auth.onboardingIntro.letSBuildYourVibe")}
      subtitle={tx("app.auth.onboardingIntro.weReGoingToAskYouAFewQuick")}
      stepNumber={tx("onboarding.step.intro")}
      primaryLabel={tx("app.auth.onboardingIntro.letSDoIt")}
      onPrimaryPress={() => {
        setStep('profile-photo-name');
      }}
      onBackPress={() => setStep('notifications-permission')}
      centerContent
    >
      <View style={styles.hero}>
        <Text style={styles.wordmark}>{tx("app.auth.onboardingIntro.sociol")}</Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = createThemedStyles((Colors) => ({
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
}));
