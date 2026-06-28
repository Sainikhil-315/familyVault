import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from '../../theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading node (Avatar, icon chip, emoji wrapped in Text). */
  leading?: React.ReactNode;
  /** Trailing node (Switch, Badge, chevron). Defaults to chevron if onPress set. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  showChevron,
  style,
}: ListRowProps) {
  const body = (
    <View style={[styles.row, style]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.text}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (showChevron || onPress ? <Text style={styles.chevron}>›</Text> : null)}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  leading: { justifyContent: 'center' },
  text: { flex: 1 },
  subtitle: { marginTop: 1 },
  chevron: { fontSize: 22, color: colors.textTertiary, marginLeft: spacing.xs },
});

export default ListRow;
