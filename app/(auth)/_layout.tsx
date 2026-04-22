import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { useAuth } from '@/src/context/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LottieSplashScreen />;
  if (user && profile?.profileComplete) return <Redirect href="/(app)" />;

  return <Stack />;
}