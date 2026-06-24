import { Radius } from '@/src/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { BlurView } from 'expo-blur';

interface ChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
}

export default function Chip({ label, selected = false, style, ...props }: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
       style={[styles.wrapper, style]}
      {...props}
    >
       <BlurView intensity={40} tint="light" style={styles.base}>
        <Text style={styles.text}>{label}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // base: {
  //   borderRadius: Radius.pill,
  //   paddingVertical: 8,
  //   paddingHorizontal: 16,
  // },
  // unselected: {
  //   backgroundColor: Colors.inputBg,
  // },
  // selected: {
  //   backgroundColor: Colors.primary,
  // },
  // text: {
  //   fontSize: 13,
  //   fontWeight: '500',
  // },
  // unselectedText: {
  //   color: Colors.textSecondary,
  // },
  // selectedText: {
  //   color: Colors.textPrimary,
  // },
  wrapper: {
    borderRadius: Radius.pill,
    overflow: 'hidden', // required for BlurView to respect borderRadius
  },
  base: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.25)', // tint on top of blur
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
