import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { colors, font, radius } from '../../lib/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  secureToggle?: boolean;
}

export function Input({ label, error, secureToggle, secureTextEntry, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.red}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          autoCapitalize="none"
          {...rest}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.eye}>
            <Text style={styles.eyeText}>{hidden ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: 7,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  rowError: {
    borderColor: colors.red,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: font.base,
    color: colors.textPrimary,
  },
  eye: {
    paddingLeft: 10,
  },
  eyeText: {
    fontSize: font.sm,
    color: colors.red,
    fontWeight: '600',
  },
  error: {
    fontSize: font.xs,
    color: colors.red,
    marginTop: 5,
    marginLeft: 2,
  },
});
