import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { useAuth } from '@/src/context/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return <LottieSplashScreen />;
  if (user?.emailVerified) return <Redirect href="/(app)" />;
  if (user) return <Redirect href="/(auth)/create-profile" />;
  return <Redirect href="/(auth)/sign-up" />;
}