import Button from '@/src/components/ui/Button';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { getLatestCircleForUser } from '@/src/services/swipe';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function Home() {
  const { user } = useAuth();
  const [hasCircle, setHasCircle] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const circle = await getLatestCircleForUser(user.uid);
      setHasCircle(Boolean(circle));
    };
    load();
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.illustration} />
        <Text style={styles.title}>No circle yet</Text>
        <Text style={styles.subtitle}>
          Create your first Circle and start meeting people
        </Text>
      </View>
      <View style={styles.footer}>
        <Button
          title={hasCircle ? 'Open My Circle' : 'Create your Circle'}
          onPress={() =>
            router.push(hasCircle ? '/(app)/circle-dashboard' : '/(app)/create-circle')
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  title: {
    ...Typography.h2,
    marginTop: Spacing.lg,
  },
  subtitle: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 280,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
});