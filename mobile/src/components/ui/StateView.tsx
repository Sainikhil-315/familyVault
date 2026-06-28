import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { colors, spacing } from '../../theme';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message }: LoadingViewProps) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text variant="body" muted style={styles.text}>{message}</Text>
      ) : null}
    </View>
  );
}

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
      </View>
      <Text variant="body" center style={styles.text}>{message}</Text>
      {onRetry ? (
        <Button title="Try Again" onPress={onRetry} fullWidth={false} style={styles.retry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { marginTop: spacing.xs },
  retry: { marginTop: spacing.sm },
});

export default { LoadingView, ErrorView };
