import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { Text } from '../../components/ui';
import { colors, spacing, radius, shadows, scaleFont } from '../../theme';
import { TAB_SCROLL_PADDING } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORIES: { key: string; label: string; icon: IoniconName; sub: string; color: string }[] = [
  { key: 'identity',  label: 'Identity',   icon: 'card-outline',          sub: 'Aadhaar, PAN, Passport', color: '#E8F0FE' },
  { key: 'property',  label: 'Property',   icon: 'home-outline',          sub: 'Land records, Deeds',     color: '#FEF3C7' },
  { key: 'financial', label: 'Financial',  icon: 'wallet-outline',        sub: 'Insurance, Passbooks',    color: '#DCFCE7' },
  { key: 'medical',   label: 'Medical',    icon: 'medkit-outline',        sub: 'Reports, Prescriptions',  color: '#FCE7F3' },
  { key: 'education', label: 'Education',  icon: 'school-outline',        sub: 'Degrees, Marksheets',     color: '#FDE8D8' },
  { key: 'vehicle',   label: 'Vehicles',   icon: 'car-outline',           sub: 'RC book, Driving license', color: '#E0F2FE' },
  { key: 'other',     label: 'Other',      icon: 'document-text-outline', sub: 'Ration card, Misc',       color: '#F3E8FF' },
];

const ICON_COLOR: Record<string, string> = {
  identity: '#4F6DD6',
  property: '#D97706',
  financial: '#16A34A',
  medical: '#DB2777',
  education: '#EA580C',
  vehicle: '#0284C7',
  other: '#7C3AED',
};

export default function DocumentsHomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h2">Family Vault</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => navigation.navigate('Category', { category: item.key, label: item.label })}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={scaleFont(26)} color={ICON_COLOR[item.key]} />
            </View>
            <Text variant="bodyMedium" style={styles.cardLabel}>{item.label}</Text>
            <Text variant="caption" numberOfLines={2}>{item.sub}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  grid: { paddingHorizontal: spacing.md, paddingBottom: TAB_SCROLL_PADDING },
  row: { gap: spacing.md, marginBottom: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 150,
    gap: spacing.xs,
    ...shadows.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardLabel: { marginTop: 2 },
});
