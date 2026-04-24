import { Colors } from '@/src/constants/theme';
import { getOnboardingRoute } from '@/src/constants/onboarding';
import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { user, profile, loading } = useAuth();
  const { currentStep, loading: onboardingLoading } = useOnboarding();

  if (loading || onboardingLoading) return <LottieSplashScreen minDurationMs={0} />;
  if (!user) return <Redirect href="/sign-up" />;
  if (!profile?.profileComplete) return <Redirect href={getOnboardingRoute(currentStep)} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDisabled,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="chats/index" options={{ title: 'Circle' }} />
      <Tabs.Screen name="create-circle" options={{ href: null }} />
      <Tabs.Screen name="swipe" options={{ href: null }} />
      <Tabs.Screen name="circle-dashboard" options={{ href: null }} />
      <Tabs.Screen name="chats/room" options={{ href: null }} />
    </Tabs>
  );
}
