import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'DocumentsHome'>;
};

const CATEGORIES = [
  { key: 'identity',  label: 'Identity',   icon: '🪪', sub: 'Aadhaar, PAN, Passport' },
  { key: 'property',  label: 'Property',   icon: '🏘️', sub: 'Land records, Deeds' },
  { key: 'financial', label: 'Financial',  icon: '💰', sub: 'Insurance, Passbooks' },
  { key: 'medical',   label: 'Medical',    icon: '🏥', sub: 'Reports, Prescriptions' },
  { key: 'education', label: 'Education',  icon: '🎓', sub: 'Degrees, Marksheets' },
  { key: 'vehicle',   label: 'Vehicles',   icon: '🚗', sub: 'RC book, Driving license' },
  { key: 'other',     label: 'Other',      icon: '📄', sub: 'Ration card, Misc' },
] as const;

export default function DocumentsHomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Vault</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DocumentUpload')}>
          <Text style={styles.uploadText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Category', { category: item.key, label: item.label })}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardSub}>{item.sub}</Text>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '500', width: 60 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  uploadText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600', width: 70, textAlign: 'right' },
  grid: { padding: spacing.md },
  row: { gap: spacing.md, marginBottom: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  cardIcon: { fontSize: 32, marginBottom: spacing.sm },
  cardLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  cardSub: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
});
