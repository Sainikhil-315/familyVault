import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography, TypographyVariant, colors } from '../../theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
  muted?: boolean;
}

/**
 * Typed text primitive. Always prefer this over raw <Text> so every label
 * pulls from the shared type scale.
 */
export function Text({
  variant = 'body',
  color,
  center,
  muted,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        typography[variant],
        muted && { color: colors.textSecondary },
        color && { color },
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});

export default Text;
