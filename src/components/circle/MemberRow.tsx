import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import Avatar from '../ui/Avatar';

interface MemberRowProps {
  member: {
    uid: string;
    name: string;
    photoURL?: string;
    joinedAt?: string;
    isHost?: boolean;
  };
  onPress?: (member: any) => void;
  showJoinDate?: boolean;
  showHostBadge?: boolean;
}

export default function MemberRow({ 
  member, 
  onPress, 
  showJoinDate = false,
  showHostBadge = true 
}: MemberRowProps) {
  const handlePress = () => {
    onPress?.(member);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Avatar
        uri={member.photoURL}
        size={48}
        style={styles.avatar}
      />
      
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.name}</Text>
          {showHostBadge && member.isHost && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>HOST</Text>
            </View>
          )}
        </View>
        
        {showJoinDate && member.joinedAt && (
          <Text style={styles.joinDate}>
            Joined {new Date(member.joinedAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.status}>
        <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
        <Text style={styles.statusText}>Active</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  avatar: {
    borderWidth: 2,
    borderColor: Colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    ...Typography.body,
    fontWeight: '600',
  },
  hostBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  hostBadgeText: {
    ...Typography.bodySmall,
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
  },
  joinDate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  status: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
