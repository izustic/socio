import Avatar from '@/src/components/ui/Avatar';
import Input from '@/src/components/ui/Input';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { getLatestCircleForUser, getUsersByIds, SwipeCandidate } from '@/src/services/swipe';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CircleChatRoom() {
  const { user } = useAuth();
  const [circleName, setCircleName] = useState('Circle Chat');
  const [members, setMembers] = useState<SwipeCandidate[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const circle = await getLatestCircleForUser(user.uid);
      if (!circle) return;
      setCircleName(circle.name);
      const memberProfiles = await getUsersByIds(circle.members || []);
      setMembers(memberProfiles);
    };
    load();
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{circleName}</Text>
        <View style={styles.avatars}>
          {members.slice(0, 4).map((member, index) => (
            <Avatar
              key={member.uid}
              size="sm"
              uri={member.photoURL || undefined}
              placeholder={!member.photoURL}
              style={index > 0 ? styles.avatarOverlap : undefined}
            />
          ))}
        </View>
      </View>

      <View style={styles.messages}>
        <View style={styles.leftMessageRow}>
          <Avatar size="sm" placeholder />
          <View>
            <Text style={styles.senderName}>Alex</Text>
            <View style={styles.leftBubble}>
              <Text style={styles.leftBubbleText}>Hey everyone! So hyped for Sunday 👀</Text>
            </View>
          </View>
        </View>
        <View style={styles.leftMessageRow}>
          <Avatar size="sm" placeholder />
          <View>
            <Text style={styles.senderName}>Yui</Text>
            <View style={styles.leftBubble}>
              <Text style={styles.leftBubbleText}>Same! Anyone know good spots downtown?</Text>
            </View>
          </View>
        </View>
        <View style={styles.rightBubble}>
          <Text style={styles.rightBubbleText}>I&apos;ll start a poll 👇</Text>
        </View>

        <View style={styles.pollCard}>
          <View style={styles.pollHeader}>
            <Text style={styles.pollIcon}>📊</Text>
            <Text style={styles.pollQuestion}>Where should we meet?</Text>
          </View>
          
          <View style={styles.pollOption}>
            <View style={[styles.pollFill, { width: '60%', backgroundColor: Colors.primaryLight }]} />
            <View style={styles.pollOptionContent}>
              <Text style={styles.pollOptionText}>Blue Bottle, Mission</Text>
              <Text style={styles.pollVoteCount}>3</Text>
            </View>
          </View>

          <View style={styles.pollOption}>
            <View style={[styles.pollFill, { width: '40%', backgroundColor: '#FFF8EA' }]} />
            <View style={styles.pollOptionContent}>
              <Text style={styles.pollOptionText}>Sightglass Coffee</Text>
              <Text style={styles.pollVoteCount}>2</Text>
            </View>
          </View>

          <View style={styles.pollOption}>
            <View style={styles.pollOptionContent}>
              <Text style={styles.pollOptionText}>Ritual Coffee Roasters</Text>
              <Text style={styles.pollVoteCount}>0</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.inputRow}>
        <TouchableOpacity activeOpacity={0.7} style={styles.attachButton}>
          <Text>＋</Text>
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Input placeholder="Message Circle..." />
        </View>
        <TouchableOpacity activeOpacity={0.7} style={styles.sendButton}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
  },
  avatars: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  messages: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  leftMessageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  leftBubble: {
    backgroundColor: Colors.inputBg,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '75%',
  },
  leftBubbleText: {
    ...Typography.body,
  },
  rightBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '75%',
  },
  rightBubbleText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  pollCard: {
    backgroundColor: '#FFF8EA',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  pollIcon: {
    fontSize: 16,
  },
  pollQuestion: {
    ...Typography.body,
    fontWeight: '700',
  },
  pollOption: {
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  pollFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  pollOptionText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pollVoteCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: Colors.textPrimary,
  },
});
