import { Colors, Radius } from '@/src/constants/theme';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

export default function Input(props: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={Colors.textDisabled}
        style={[styles.input, props.style]}
      />
      <View style={[styles.accentLine, focused && styles.accentLineFocused]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  accentLine: {
    height: 2,
    backgroundColor: 'transparent',
    marginTop: 2,
    borderRadius: Radius.full,
  },
  accentLineFocused: {
    backgroundColor: Colors.primary,
  },
});
