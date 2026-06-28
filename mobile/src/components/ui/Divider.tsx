import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.line, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});

export default Divider;
