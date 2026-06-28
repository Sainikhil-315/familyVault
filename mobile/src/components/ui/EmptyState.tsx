import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { colors, spacing, scaleFont } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon?: IoniconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'default' | 'error';
}

export function EmptyState({ icon, title, message, actionLabel, onAction, tone = 'default' }: EmptyStateProps) {
  const iconColor = tone === 'error' ? colors.error : colors.textTertiary;
  return (
    <View style={styles.container}>
      {icon ? (
        <View style={[styles.iconWrap, tone === 'error' && styles.iconWrapError]}>
          <Ionicons name={icon} size={scaleFont(36)} color={iconColor} />
        </View>
      ) : null}
      <Text variant="h2" center>{title}</Text>
      {message ? (
        <Text variant="body" muted center style={styles.message}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F4F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconWrapError: { backgroundColor: colors.errorLight },
  message: { marginTop: spacing.xs },
  action: { marginTop: spacing.lg },
});

export default EmptyState;
