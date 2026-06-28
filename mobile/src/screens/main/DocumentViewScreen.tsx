import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'DocumentView'>;
  route: RouteProp<AppStackParamList, 'DocumentView'>;
};

export default function DocumentViewScreen({ navigation, route }: Props) {
  const { doc } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{doc.fileName}</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Sprint 4</Text>
        <Text style={styles.subtitle}>
          Presigned URL fetch + client-side decryption + PDF/image viewer coming in Sprint 4.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '500', width: 60 },
  headerTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl, gap: spacing.md },
  icon: { fontSize: 48 },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
