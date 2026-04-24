import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { getOnboardingRoute } from '@/src/constants/onboarding';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, profile, loading } = useAuth();
  const { currentStep, loading: onboardingLoading } = useOnboarding();

  if (loading || onboardingLoading) return <LottieSplashScreen minDurationMs={0} />;
  if (user && profile?.profileComplete) return <Redirect href="/(app)" />;
  if (user) return <Redirect href={getOnboardingRoute(currentStep)} />;
  return <Redirect href="/sign-up" />;
}
