import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import Avatar from '../ui/Avatar';
import AvatarStack from '../ui/AvatarStack';
import CapacityBadge from '../ui/CapacityBadge';

interface CircleCardProps {
  circle: {
    id: string;
    name: string;
    description?: string;
    size: number;
    currentMembers: number;
    hostName: string;
    hostPhoto?: string;
    memberAvatars?: Array<{ uri?: string; name?: string }>;
    vibe?: string;
    location?: string;
  };
  onLike?: () => void;
  onPass?: () => void;
  onInfo?: () => void;
}

export default function CircleCard({ 
  circle, 
  onLike, 
  onPass, 
  onInfo 
}: CircleCardProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.hostInfo}>
          <Avatar uri={circle.hostPhoto} size={40} />
          <View style={styles.hostDetails}>
            <Text style={styles.hostName}>{circle.hostName}'s Circle</Text>
            <Text style={styles.circleName}>{circle.name}</Text>
          </View>
        </View>
        
        <CapacityBadge 
          current={circle.currentMembers}
          max={circle.size}
          size="sm"
        />
      </View>

      {/* Description */}
      {circle.description && (
        <Text style={styles.description} numberOfLines={2}>
          {circle.description}
        </Text>
      )}

      {/* Vibe */}
      {circle.vibe && (
        <View style={styles.vibeContainer}>
          <Text style={styles.vibeLabel}>Vibe:</Text>
          <Text style={styles.vibeText}>{circle.vibe}</Text>
        </View>
      )}

      {/* Location */}
      {circle.location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{circle.location}</Text>
        </View>
      )}

      {/* Members */}
      {circle.memberAvatars && circle.memberAvatars.length > 0 && (
        <View style={styles.membersContainer}>
          <Text style={styles.membersLabel}>Members:</Text>
          <AvatarStack 
            avatars={circle.memberAvatars}
            maxVisible={3}
            size="sm"
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Text style={styles.passText}>✕</Text>
        </View>
        
        <View style={styles.actionButton}>
          <Text style={styles.infoText}>ℹ</Text>
        </View>
        
        <View style={styles.actionButton}>
          <Text style={styles.likeText}>♥</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  circleName: {
    ...Typography.h3,
    fontWeight: '700',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  vibeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vibeLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  vibeText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  likeText: {
    fontSize: 18,
    color: '#FF5252',
    fontWeight: '700',
  },
});
