import 'react-native-url-polyfill/auto';
import '@/src/polyfills';
import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { OnboardingProvider } from '@/src/context/OnboardingContext';
import { AuthProvider } from '@/src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hand off from the native launch screen to the in-app Lottie splash as fast as possible.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (showSplash) {
    return (
      <LottieSplashScreen
        minDurationMs={3500}
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  return (
    <AuthProvider>
      <OnboardingProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="circle/no-circle" />
          <Stack.Screen name="circle/create" />
          <Stack.Screen name="circle/create-preferences" />
          <Stack.Screen name="circle/join-preferences" />
          <Stack.Screen name="circle/swipe-users" />
          <Stack.Screen name="circle/swipe-circles" />
          <Stack.Screen name="circle/swipe-empty" />
          <Stack.Screen name="circle/progress" />
          <Stack.Screen name="circle/complete" />
          <Stack.Screen name="circle/chat" />
          <Stack.Screen name="circle/call" />
          <Stack.Screen name="circle/info" />
        </Stack>
      </OnboardingProvider>
    </AuthProvider>
  );
}
