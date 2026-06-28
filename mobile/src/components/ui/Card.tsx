import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Visual weight. 'flat' = hairline only, 'raised' = soft shadow. Default 'raised'. */
  elevation?: 'flat' | 'raised';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, elevation = 'raised', padded = true, style }: CardProps) {
  const content = (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevation === 'raised' ? shadows.sm : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
});

export default Card;
