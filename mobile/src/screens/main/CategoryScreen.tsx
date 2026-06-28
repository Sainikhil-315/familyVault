import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, Alert, StyleSheet, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppStackParamList } from '../../types/navigation';
import { listDocuments, DocumentMeta } from '../../api/documents.api';
import { useAuth } from '../../contexts/AuthContext';
import { AppHeader, ListRow, IconChip, LoadingView, EmptyState, SearchBar, Text } from '../../components/ui';
import { colors, spacing } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Category'>;
  route: RouteProp<AppStackParamList, 'Category'>;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDocIcon(doc: DocumentMeta): IoniconName {
  const mimeType = doc.pages?.[0]?.mimeType ?? '';
  if (mimeType.includes('pdf')) return 'document-text-outline';
  if (mimeType.startsWith('image/')) return 'image-outline';
  return 'document-outline';
}

export default function CategoryScreen({ navigation, route }: Props) {
  const { category, label } = route.params;
  const { familyId } = useAuth();
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

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

  useFocusEffect(useCallback(() => { fetchDocs(); setQuery(''); }, [fetchDocs]));

  const filteredDocs = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return docs;
    return docs.filter(d => d.name.toLowerCase().includes(q));
  }, [docs, query]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchDocs();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: DocumentMeta }) {
    const pageCount = item.pages?.length ?? 1;
    const size = formatBytes(item.totalSize ?? 0);
    return (
      <ListRow
        title={item.name}
        subtitle={`${pageCount} page${pageCount > 1 ? 's' : ''} · ${size} · ${formatDate(item.uploadedAt)}`}
        leading={<IconChip icon={getDocIcon(item)} size={44} />}
        showChevron
        onPress={() => navigation.navigate('DocumentView', { doc: item })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader title={label} onBack={() => navigation.goBack()} />
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={`Search ${label.toLowerCase()} documents…`}
      />

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={filteredDocs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            query.trim() ? (
              <EmptyState
                icon="search-outline"
                title={`No results for "${query}"`}
              />
            ) : (
              <EmptyState
                icon="folder-open-outline"
                title={`No ${label.toLowerCase()} documents yet`}
                actionLabel="Upload First Document"
                onAction={() => navigation.navigate('DocumentUpload', { presetCategory: category })}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, padding: spacing.lg, gap: spacing.xs },
});
