import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, font, radius } from '../../lib/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.red : colors.white} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`], textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.red,
  },
  ghost: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: colors.redMid,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: font.base,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryLabel: {
    color: colors.white,
  },
  ghostLabel: {
    color: colors.textSecondary,
  },
  dangerLabel: {
    color: colors.red,
  },
});
