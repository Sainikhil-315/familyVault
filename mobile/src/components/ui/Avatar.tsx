import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, scaleFont } from '../../theme';

interface AvatarProps {
  /** Name or phone — first char is used as the initial. */
  name?: string | null;
  size?: number;
  tone?: 'primary' | 'neutral';
}

export function Avatar({ name, size = 40, tone = 'primary' }: AvatarProps) {
  const initial = (name?.trim()?.charAt(0) || '?').toUpperCase();
  const bg = tone === 'primary' ? colors.primaryLight : colors.surfaceAlt;
  const fg = tone === 'primary' ? colors.primary : colors.textSecondary;
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={{ color: fg, fontSize: scaleFont(size * 0.4), fontWeight: '700' }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { justifyContent: 'center', alignItems: 'center' },
});

export default Avatar;
