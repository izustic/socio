import { getOnboardingRoute } from '@/src/constants/onboarding';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { Redirect } from 'expo-router';

export default function LegacyCreateProfileScreen() {
  const { currentStep } = useOnboarding();

  return <Redirect href={getOnboardingRoute(currentStep)} />;
}
