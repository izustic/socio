import { Colors } from '@/src/constants/theme';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  const insets = useSafeAreaInsets();

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
      <Tabs.Screen name="chats/index" options={{ title: 'Chats' }} />
      <Tabs.Screen name="create-circle" options={{ href: null }} />
      <Tabs.Screen name="swipe" options={{ href: null }} />
      <Tabs.Screen name="circle-dashboard" options={{ href: null }} />
    </Tabs>
  );
}