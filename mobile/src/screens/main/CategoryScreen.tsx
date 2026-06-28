import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { listDocuments, DocumentMeta } from '../../api/documents.api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Category'>;
  route: RouteProp<AppStackParamList, 'Category'>;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CategoryScreen({ navigation, route }: Props) {
  const { category, label } = route.params;
  const { familyId } = useAuth();
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    if (!familyId) return;
    try {
      const data = await listDocuments(familyId, category);
      setDocs(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load documents');
    } finally {
      setLoading(false);
    }
  }, [familyId, category]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  function renderItem({ item }: { item: DocumentMeta }) {
    return (
      <TouchableOpacity
        style={styles.docRow}
        onPress={() => navigation.navigate('DocumentView', { doc: item })}
      >
        <View style={styles.docIcon}>
          <Text style={styles.docIconText}>
            {item.mimeType.includes('pdf') ? '📄' : '🖼️'}
          </Text>
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={1}>{item.fileName}</Text>
          <Text style={styles.docMeta}>{formatBytes(item.fileSize)} · {formatDate(item.uploadedAt)}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{label}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DocumentUpload', { presetCategory: category })}>
          <Text style={styles.uploadText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>No {label.toLowerCase()} documents yet</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('DocumentUpload', { presetCategory: category })}
              >
                <Text style={styles.addBtnText}>Upload First Document</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  uploadText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600', width: 60, textAlign: 'right' },
  list: { padding: spacing.md },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  docIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  docIconText: { fontSize: 22 },
  docInfo: { flex: 1 },
  docName: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  docMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 10 },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.md },
});
