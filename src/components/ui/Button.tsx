import { createThemedStyles, Colors, Radius, Typography } from '@/src/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({
  title,
  variant = 'primary',
  style,
  disabled,
  loading = false,
  fullWidth = true,
  ...props
}: ButtonProps) {
  const variantStyle = variant === 'primary'
    ? styles.primary
    : variant === 'outline'
      ? styles.outline
      : styles.ghost;
  const textStyle = variant === 'ghost' ? styles.ghostText : styles.mainText;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyle,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = createThemedStyles((Colors) => ({
  base: {
    borderRadius: Radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  outline: {
    backgroundColor: Colors.surface,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
  },
  mainText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  ghostText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  disabled: {
    opacity: 0.5,
  },
}));
