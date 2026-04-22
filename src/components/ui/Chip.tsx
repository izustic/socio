import { Colors, Radius } from '@/src/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
}

export default function Chip({ label, selected = false, style, ...props }: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.base, selected ? styles.selected : styles.unselected, style]}
      {...props}
    >
      <Text style={[styles.text, selected ? styles.selectedText : styles.unselectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unselected: {
    backgroundColor: Colors.inputBg,
  },
  selected: {
    backgroundColor: Colors.primary,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  unselectedText: {
    color: Colors.textSecondary,
  },
  selectedText: {
    color: Colors.textPrimary,
  },
});
