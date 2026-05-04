import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { getOnboardingPathname, getOnboardingRoute } from '@/src/constants/onboarding';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { Redirect, Stack, usePathname } from 'expo-router';
import { useMemo } from 'react';

const WELCOME_PATHNAME = '/welcome';

export default function AuthLayout() {
  const { user, profile, loading } = useAuth();
  const { currentStep, loading: onboardingLoading } = useOnboarding();
  const pathname = usePathname();

  // Memoize the redirect logic to prevent infinite re-renders
  const redirectComponent = useMemo(() => {
    // Show splash while loading auth or onboarding state
    if (loading || onboardingLoading) {
      return <LottieSplashScreen minDurationMs={0} />;
    }
    
    // User with complete profile → redirect to main app (bypass auth layout)
    if (user && profile?.profileComplete) {
      return <Redirect href="/(tabs)/home" />;
    }
    
    // No user → only allow welcome screen, redirect everything else to welcome
    if (!user && pathname !== WELCOME_PATHNAME) {
      return <Redirect href="/(auth)/welcome" />;
    }
    
    // User without complete profile → handle onboarding flow
    if (user && !profile?.profileComplete && currentStep) {
      const targetRoute = getOnboardingRoute(currentStep);
      const targetPathname = getOnboardingPathname(currentStep);
      
      // Only redirect if we're not already on the correct onboarding step
      if (pathname !== targetPathname) {
        return <Redirect href={targetRoute} />;
      }
    }

    return null;
  }, [user, profile, loading, onboardingLoading, currentStep, pathname]);

  // If we have a redirect, return it
  if (redirectComponent) {
    return redirectComponent;
  }

  // Otherwise render the stack
  return <Stack screenOptions={{ headerShown: false }} />;
}
