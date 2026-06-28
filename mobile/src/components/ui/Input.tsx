import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Text } from './Text';
import { colors, spacing, radius, typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  /** Right-side adornment (e.g. eye toggle). */
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  hint,
  right,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="bodyMedium" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? (
        <Text variant="caption" color={colors.error} style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { marginBottom: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.error },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  right: { paddingLeft: spacing.sm },
  helper: { marginTop: 2 },
});

export default Input;
