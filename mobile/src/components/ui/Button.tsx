import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { Text } from './Text';
import { colors, spacing, radius, typography } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Emoji / text icon shown before the label. */
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        { paddingVertical: s.paddingV, borderRadius: radius.md },
        v.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <View style={styles.content}>
          {icon ? <Text style={[styles.icon, { fontSize: s.fontSize }]}>{icon} </Text> : null}
          <Text style={[typography.button, { color: v.text, fontSize: s.fontSize } as TextStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const VARIANTS: Record<Variant, { container: ViewStyle; text: string; spinner: string }> = {
  primary: { container: { backgroundColor: colors.primary }, text: colors.white, spinner: colors.white },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primaryBorder },
    text: colors.primary,
    spinner: colors.primary,
  },
  ghost: { container: { backgroundColor: 'transparent' }, text: colors.primary, spinner: colors.primary },
  danger: { container: { backgroundColor: colors.error }, text: colors.white, spinner: colors.white },
};

const SIZES: Record<Size, { paddingV: number; fontSize: number }> = {
  sm: { paddingV: spacing.sm, fontSize: 14 },
  md: { paddingV: spacing.sm + 2, fontSize: 15 },
  lg: { paddingV: spacing.md, fontSize: 16 },
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { color: colors.white },
});

export default Button;
