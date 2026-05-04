import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/src/constants/theme';
import Avatar from './Avatar';

interface AvatarStackProps {
  avatars: Array<{ uri?: string; name?: string }>;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  showOverflow?: boolean;
}

export default function AvatarStack({ 
  avatars, 
  maxVisible = 3, 
  size = 'md',
  showOverflow = true 
}: AvatarStackProps) {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const overflowCount = avatars.length - maxVisible;

  const getSize = () => {
    switch (size) {
      case 'sm': return 24;
      case 'md': return 32;
      case 'lg': return 40;
      default: return 32;
    }
  };

  const avatarSize = getSize();

  return (
    <View style={styles.container}>
      <View style={styles.avatarStack}>
        {visibleAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            uri={avatar.uri}
            size={avatarSize}
            style={[
              styles.avatar,
              { marginLeft: index > 0 ? -avatarSize * 0.3 : 0 }
            ]}
          />
        ))}
        {showOverflow && overflowCount > 0 && (
          <View
            style={[
              styles.overflowBadge,
              {
                width: avatarSize,
                height: avatarSize,
                marginLeft: -avatarSize * 0.3,
                borderRadius: avatarSize / 2,
              }
            ]}
          >
            <Text style={styles.overflowText}>+{overflowCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  overflowBadge: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  overflowText: {
    ...Typography.bodySmall,
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
});
