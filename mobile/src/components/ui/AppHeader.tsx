import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { colors, spacing, layout } from '../../theme';

interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  rightDisabled?: boolean;
  right?: React.ReactNode;
  left?: React.ReactNode;
  bordered?: boolean;
}

export function AppHeader({
  title,
  onBack,
  rightLabel,
  onRightPress,
  rightDisabled,
  right,
  left,
  bordered = true,
}: AppHeaderProps) {
  return (
    <View style={[styles.header, bordered && styles.bordered]}>
      <View style={styles.side}>
        {left ??
          (onBack ? (
            <TouchableOpacity onPress={onBack} hitSlop={layout.hitSlop} style={styles.backBtn}>
              <Icon name="chevron-back" size={22} color={colors.primary} />
              <Text variant="bodyMedium" color={colors.primary}>Back</Text>
            </TouchableOpacity>
          ) : null)}
      </View>

      <Text variant="title" numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={[styles.side, styles.rightSide]}>
        {right ??
          (rightLabel ? (
            <TouchableOpacity onPress={onRightPress} disabled={rightDisabled} hitSlop={layout.hitSlop}>
              <Text variant="bodyMedium" color={rightDisabled ? colors.textTertiary : colors.primary}>
                {rightLabel}
              </Text>
            </TouchableOpacity>
          ) : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  bordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  side: { minWidth: 72, justifyContent: 'center' },
  rightSide: { alignItems: 'flex-end' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  title: { flex: 1, textAlign: 'center' },
});

export default AppHeader;
