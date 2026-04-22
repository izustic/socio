import Avatar from '@/src/components/ui/Avatar';
import Button from '@/src/components/ui/Button';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import {
  getCircleById,
  getLatestCircleForUser,
  getUsersByIds,
  SwipeCandidate,
} from '@/src/services/swipe';
import { Circle } from '@/src/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function CircleDashboardScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<(Circle & { id: string }) | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const targetCircle = params.circleId
          ? await getCircleById(String(params.circleId))
          : await getLatestCircleForUser(user.uid);
        setCircle(targetCircle);
        if (targetCircle) {
          const memberProfiles = await getUsersByIds(targetCircle.members || []);
          setMembers(memberProfiles);
        } else {
          setMembers([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, params.circleId]);

  const progressText = useMemo(() => {
    if (!circle) return '0 of 0 members';
    return `${(circle.members || []).length} of ${circle.size} members`;
  }, [circle]);

  const progressWidth = useMemo(() => {
    if (!circle || !circle.size) return '0%';
    const ratio = Math.min(1, (circle.members || []).length / circle.size);
    return `${ratio * 100}%`;
  }, [circle]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <Text style={styles.title}>My Circle</Text>
          <Text style={styles.subtitle}>You have not created a circle yet.</Text>
          <View style={styles.ctaWrap}>
            <Button title="Create Circle" onPress={() => router.replace('/(app)/create-circle')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const membersNeeded = Math.max(0, circle.size - (circle.members || []).length);
  const isComplete = circle.status === 'complete' || membersNeeded === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>{circle.name || 'My Circle'}</Text>
        <Text style={styles.subtitle}>
          {isComplete ? 'Your circle is complete' : 'Your circle is forming'}
        </Text>

        <View style={styles.memberRow}>
          {Array.from({ length: circle.size }).map((_, index) => {
            const member = members[index];
            return (
              <Avatar
                key={`${member?.uid || 'empty'}-${index}`}
                size="md"
                uri={member?.photoURL || undefined}
                placeholder={!member?.photoURL}
                style={index > 0 ? styles.memberOverlap : undefined}
              />
            );
          })}
        </View>

        <Text style={styles.progressLabel}>{progressText}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.statusText}>
          {isComplete
            ? 'Circle ready. Start chatting with your group.'
            : `${membersNeeded} more ${membersNeeded === 1 ? 'person' : 'people'} to complete your Circle`}
        </Text>
      </View>

      <View style={styles.footer}>
        {isComplete ? (
          <Button title="Open Circle Chat" onPress={() => router.push('/(app)/chats/index')} />
        ) : (
          <Button title="Continue Swiping" onPress={() => router.push('/(app)/swipe')} />
        )}
        <Button title="Edit Circle" variant="ghost" onPress={() => router.push('/(app)/create-circle')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  memberOverlap: {
    marginLeft: -8,
  },
  progressLabel: {
    ...Typography.h3,
    textAlign: 'center',
  },
  progressTrack: {
    marginTop: Spacing.sm,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  statusText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  ctaWrap: {
    width: '100%',
    marginTop: Spacing.lg,
  },
});
