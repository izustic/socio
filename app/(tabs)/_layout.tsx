import { Colors } from '@/src/constants/theme';
import { SwipeTabVisibilityProvider, useSwipeTabVisibility } from '@/src/context/SwipeTabVisibilityContext';
import { Tabs, useFocusEffect } from 'expo-router';
import { Bell, Layers, User, Users } from 'lucide-react-native';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabLayoutInner() {
  const insets = useSafeAreaInsets();
  const { swipeTabVisible, refreshSwipeTabVisibility } = useSwipeTabVisibility();

  useFocusEffect(
    useCallback(() => {
      refreshSwipeTabVisibility();
    }, [refreshSwipeTabVisibility]),
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#AAAAAA',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Circle',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Swipe',
          href: swipeTabVisible ? undefined : null,
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <SwipeTabVisibilityProvider>
      <TabLayoutInner />
    </SwipeTabVisibilityProvider>
  );
}
