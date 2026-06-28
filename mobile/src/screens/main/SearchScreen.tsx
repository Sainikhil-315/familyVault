import React, { useState, useEffect, useMemo } from 'react';
import { FlatList, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { listDocuments, DocumentMeta } from '../../api/documents.api';
import { getMembers } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import {
  AppHeader,
  ListRow,
  IconChip,
  LoadingView,
  EmptyState,
  SearchBar,
  Text,
} from '../../components/ui';
import { colors, spacing, scaleFont } from '../../theme';
import { buildSearchableDocs, filterDocs, SearchableDoc } from '../../utils/searchDocs';
import { CATEGORIES, ICON_COLOR } from './DocumentsHomeScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.key, c.label])
);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDocIcon(doc: DocumentMeta): IoniconName {
  const mimeType = doc.pages?.[0]?.mimeType ?? '';
  if (mimeType.includes('pdf')) return 'document-text-outline';
  if (mimeType.startsWith('image/')) return 'image-outline';
  return 'document-outline';
}

export default function SearchScreen({ navigation }: Props) {
  const { familyId } = useAuth();
  const [query, setQuery] = useState('');
  const [allDocs, setAllDocs] = useState<SearchableDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;
    (async () => {
      try {
        const [docs, members] = await Promise.all([
          listDocuments(familyId),
          getMembers(familyId),
        ]);
        const membersMap = new Map(members.map(m => [m.id, m.name]));
        setAllDocs(buildSearchableDocs(docs, membersMap, CATEGORY_LABELS));
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not load documents');
      } finally {
        setLoading(false);
      }
    })();
  }, [familyId]);

  const results = useMemo(() => filterDocs(allDocs, query), [allDocs, query]);

  function renderItem({ item }: { item: SearchableDoc }) {
    const pageCount = item.pages?.length ?? 1;
    const size = formatBytes(item.totalSize ?? 0);
    const iconColor = ICON_COLOR[item.category] ?? colors.textTertiary;
    return (
      <ListRow
        title={item.name}
        subtitle={`${item.categoryLabel} · ${item.memberName} · ${pageCount} page${pageCount > 1 ? 's' : ''} · ${size} · ${formatDate(item.uploadedAt)}`}
        leading={<IconChip icon={getDocIcon(item)} size={44} iconColor={iconColor} />}
        showChevron
        onPress={() => navigation.navigate('DocumentView', { doc: item })}
      />
    );
  }

  function renderEmpty() {
    if (!query.trim()) {
      return (
        <View style={styles.promptWrap}>
          <Ionicons name="search-outline" size={scaleFont(40)} color={colors.textTertiary} />
          <Text variant="body" muted style={styles.promptText}>
            Start typing to search documents
          </Text>
        </View>
      );
    }
    return (
      <EmptyState
        icon="search-outline"
        title={`No results for "${query}"`}
        message="Try a different name, member, or category"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Search"
        onBack={() => navigation.goBack()}
      />
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Doc name, member, or category…"
        autoFocus
        containerStyle={styles.searchBar}
      />

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { paddingTop: 0 },
  list: { flexGrow: 1, padding: spacing.lg, gap: spacing.xs },
  promptWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xxl,
  },
  promptText: { textAlign: 'center' },
});
