import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { getOnboardingRoute } from '@/src/constants/onboarding';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { Redirect, Stack, usePathname } from 'expo-router';

export default function AuthLayout() {
  const { user, profile, loading } = useAuth();
  const { currentStep, loading: onboardingLoading } = useOnboarding();
  const pathname = usePathname();

  if (loading || onboardingLoading) return <LottieSplashScreen minDurationMs={0} />;
  if (user && profile?.profileComplete) return <Redirect href="/(app)" />;
  if (!user && pathname !== '/sign-up') return <Redirect href="/sign-up" />;
  if (user && !profile?.profileComplete) {
    const target = getOnboardingRoute(currentStep);
    if (pathname !== target) {
      return <Redirect href={target} />;
    }
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
