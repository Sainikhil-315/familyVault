import React from 'react';
import { StyleSheet, StyleProp, TextStyle } from 'react-native';
import { Text } from './Text';
import { spacing } from '../../theme';

interface SectionLabelProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <Text variant="label" style={[styles.label, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.sm },
});

export default SectionLabel;
