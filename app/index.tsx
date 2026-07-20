import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import {
  getOnboardingRoute,
  getSafeOnboardingStep,
} from '@/src/constants/onboarding';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { useRole } from '@/src/hooks/useRole';
import { requiresEmailOnboardingVerification } from '@/src/services/auth';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';

const PENDING_EMAIL_VERIFICATION_MAX_AGE_MS = 10 * 60 * 1000;

export default function SplashScreen() {
  const { user, profile, loading, staleAuthSessionCleared } = useAuth();
  const {
    currentStep,
    draft,
    emailVerificationSessionActive,
    loading: onboardingLoading,
    resetOnboarding,
  } = useOnboarding();
  const { loading: roleLoading, isBanned, isSuspended } = useRole();

  useEffect(() => {
    if (!staleAuthSessionCleared) return;
    resetOnboarding().catch((error) => {
      console.error('Failed to reset stale onboarding state:', error);
    });
  }, [resetOnboarding, staleAuthSessionCleared]);

  // The root layout owns the one timed splash. Keep the same visual visible only
  // if startup data is still loading after that animation has completed.
  if (loading || onboardingLoading || roleLoading) {
    return <LottieSplashScreen minDurationMs={0} />;
  }

  if (staleAuthSessionCleared) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // No user → redirect to welcome screen
  if (!user) {
    const pendingEmailVerificationIsFresh =
      Boolean(draft.contactHint) &&
      Boolean(draft.emailVerificationCodeSentAt) &&
      Date.now() - Number(draft.emailVerificationCodeSentAt) <
        PENDING_EMAIL_VERIFICATION_MAX_AGE_MS;

    if (
      draft.emailVerificationRequired &&
      currentStep === 'otp' &&
      emailVerificationSessionActive &&
      pendingEmailVerificationIsFresh
    ) {
      return <Redirect href="/(auth)/otp" />;
    }
    return <Redirect href="/(auth)/welcome" />;
  }

  // User + no profile → redirect to profile setup
  if (!profile?.profileComplete) {
    if (requiresEmailOnboardingVerification(user)) {
      return <Redirect href="/(auth)/otp" />;
    }

    const targetStep = getSafeOnboardingStep(currentStep, draft);
    return <Redirect href={getOnboardingRoute(targetStep) as any} />;
  }

  // Status 'banned' → redirect to banned screen
  if (isBanned) {
    return <Redirect href="/banned" />;
  }

  // Status 'suspended' → redirect to suspended screen
  if (isSuspended) {
    return <Redirect href="/suspended" />;
  }

  // Active users, moderators, and admins enter normal Sociol mode by default.
  // Staff tools are available from Profile without taking over the session.
  return <Redirect href="/(tabs)/home" />;
}
