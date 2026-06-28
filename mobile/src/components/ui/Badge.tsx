import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { colors, spacing, radius, scaleFont } from '../../theme';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
  primary: { bg: colors.primaryLight, fg: colors.primary },
  success: { bg: colors.successLight, fg: colors.success },
  warning: { bg: colors.warningLight, fg: colors.warning },
  error: { bg: colors.errorLight, fg: colors.error },
  info: { bg: colors.infoLight, fg: colors.info },
};

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  text: {
    fontSize: scaleFont(11),
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export default Badge;
