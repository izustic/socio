import { Colors, Radius } from '@/src/constants/theme';
import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | number;

interface AvatarProps {
  uri?: string;
  size?: AvatarSize;
  placeholder?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 80,
  xl: 120,
};

export default function Avatar({ uri, size = 'md', placeholder = false, style }: AvatarProps) {
  const dimension = typeof size === 'number' ? size : SIZE_MAP[size];
  const avatarStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: Radius.full,
  };

  if (!uri || placeholder) {
    return (
      <View style={[styles.placeholder, avatarStyle, style]}>
        <View style={styles.placeholderRing} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, avatarStyle as any, style as any]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.placeholder,
  },
  placeholder: {
    backgroundColor: Colors.placeholder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderRing: {
    width: '86%',
    height: '86%',
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderStyle: 'dotted',
    borderColor: 'rgba(245, 197, 24, 0.4)',
  },
});
