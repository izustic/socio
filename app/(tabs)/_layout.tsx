import { Colors } from '@/src/constants/theme';
import LottieSplashScreen from '@/src/components/LottieSplashScreen';
import { useAuth } from '@/src/context/AuthContext';
import { useSwipeTabVisibility } from '@/src/context/SwipeTabVisibilityContext';
import { useLocale } from '@/src/providers/LocaleProvider';
import { Redirect, Tabs, useFocusEffect } from 'expo-router';
import { Bell, Layers, Sparkles, User, Users } from 'lucide-react-native';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabLayoutInner() {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { swipeTabVisible, circleTabVisible, refreshSwipeTabVisibility } =
    useSwipeTabVisibility();

  useFocusEffect(
    useCallback(() => {
      void refreshSwipeTabVisibility({ silent: true });
    }, [refreshSwipeTabVisibility]),
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#AAAAAA',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
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
          title: t('tabs.circle'),
          href: circleTabVisible ? undefined : null,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: t('tabs.swipe'),
          href: swipeTabVisible ? undefined : null,
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: t('tabs.likes'),
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.alerts'),
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LottieSplashScreen minDurationMs={0} />;
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!profile?.profileComplete) {
    return <Redirect href="/(auth)/profile-photo-name" />;
  }

  return <TabLayoutInner />;
}
