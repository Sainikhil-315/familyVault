import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, scaleFont } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconChipProps {
  icon: IoniconName;
  size?: number;
  bg?: string;
  iconColor?: string;
}

export function IconChip({ icon, size = 44, bg = colors.primaryLight, iconColor = colors.primary }: IconChipProps) {
  return (
    <View style={[styles.chip, { width: size, height: size, borderRadius: radius.md, backgroundColor: bg }]}>
      <Ionicons name={icon} size={scaleFont(size * 0.48)} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { justifyContent: 'center', alignItems: 'center' },
});

export default IconChip;
