import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { useRole } from '@/src/hooks/useRole';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, profile, loading } = useAuth();
  const { loading: onboardingLoading } = useOnboarding();
  const { loading: roleLoading, isBanned, isSuspended } = useRole();

  useEffect(() => {
    // Show splash for minimum duration, then redirect based on auth state
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500); // 3.5 seconds minimum splash screen

    return () => clearTimeout(timer);
  }, []);

  // While showing splash or loading auth/role state
  if (showSplash || loading || onboardingLoading || roleLoading) {
    return <LottieSplashScreen minDurationMs={3500} />;
  }

  // No user → redirect to welcome screen
  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // User + no profile → redirect to profile setup
  if (!profile?.profileComplete) {
    return <Redirect href="/(auth)/profile-photo-name" />;
  }

  // Status 'banned' → redirect to banned screen
  if (isBanned) {
    return <Redirect href="/banned" />;
  }

  // Status 'suspended' → redirect to suspended screen
  if (isSuspended) {
    return <Redirect href="/suspended" />;
  }

  // Active users, moderators, and admins enter normal Socio mode by default.
  // Staff tools are available from Profile without taking over the session.
  return <Redirect href="/(tabs)/home" />;
}
