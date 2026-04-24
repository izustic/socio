import 'react-native-url-polyfill/auto';
import LottieSplashScreen from '@/src/components/LottieSplashScreen';
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
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
