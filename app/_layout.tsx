import 'react-native-url-polyfill/auto';
import { AuthProvider } from '@/src/context/AuthContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
