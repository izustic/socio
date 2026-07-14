import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import {
  getOnboardingPathname,
  getOnboardingRoute,
  getSafeOnboardingStep,
} from '@/src/constants/onboarding';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { requiresEmailOnboardingVerification } from '@/src/services/auth';
import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect, useMemo } from 'react';

const WELCOME_PATHNAME = '/welcome';
const OTP_PATHNAME = '/otp';
const PENDING_EMAIL_VERIFICATION_MAX_AGE_MS = 10 * 60 * 1000;

export default function AuthLayout() {
  const { user, profile, loading, staleAuthSessionCleared } = useAuth();
  const {
    currentStep,
    draft,
    emailVerificationSessionActive,
    loading: onboardingLoading,
    resetOnboarding,
  } = useOnboarding();
  const pathname = usePathname();

  useEffect(() => {
    if (!staleAuthSessionCleared) return;
    resetOnboarding().catch((error) => {
      console.error('Failed to reset stale onboarding state:', error);
    });
  }, [resetOnboarding, staleAuthSessionCleared]);

  // Memoize the redirect logic to prevent infinite re-renders
  const redirectComponent = useMemo(() => {
    // Show splash while loading auth or onboarding state
    if (loading || onboardingLoading) {
      return <LottieSplashScreen minDurationMs={0} />;
    }

    if (staleAuthSessionCleared) {
      return <Redirect href="/(auth)/welcome" />;
    }
    
    // User with complete profile → redirect to main app (bypass auth layout)
    if (user && profile?.profileComplete) {
      return <Redirect href="/(tabs)/home" />;
    }
    
    const pendingEmailVerificationIsFresh =
      Boolean(draft.contactHint) &&
      Boolean(draft.emailVerificationCodeSentAt) &&
      Date.now() - Number(draft.emailVerificationCodeSentAt) <
        PENDING_EMAIL_VERIFICATION_MAX_AGE_MS;

    if (
      !user &&
      draft.emailVerificationRequired &&
      currentStep === 'otp' &&
      emailVerificationSessionActive &&
      pendingEmailVerificationIsFresh
    ) {
      if (pathname !== OTP_PATHNAME) {
        return <Redirect href="/(auth)/otp" />;
      }
      return null;
    }

    // No user → only allow welcome screen, redirect everything else to welcome
    if (!user && pathname !== WELCOME_PATHNAME) {
      return <Redirect href="/(auth)/welcome" />;
    }
    
    // User without complete profile → handle onboarding flow
    if (user && !profile?.profileComplete && currentStep) {
      if (requiresEmailOnboardingVerification(user)) {
        if (pathname !== OTP_PATHNAME) {
          return <Redirect href="/(auth)/otp" />;
        }
        return null;
      }

      const targetStep = getSafeOnboardingStep(currentStep, draft);
      const targetRoute = getOnboardingRoute(targetStep);
      const targetPathname = getOnboardingPathname(targetStep);

      // Only redirect if we're not already on the correct onboarding step
      if (pathname !== targetPathname) {
        return <Redirect href={targetRoute as any} />;
      }
    }

    return null;
  }, [
    user,
    profile,
    loading,
    onboardingLoading,
    staleAuthSessionCleared,
    currentStep,
    draft,
    emailVerificationSessionActive,
    pathname,
  ]);

  // If we have a redirect, return it
  if (redirectComponent) {
    return redirectComponent;
  }

  // Otherwise render the stack
  return <Stack screenOptions={{ headerShown: false }} />;
}
