import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { listDocuments, DocumentMeta } from '../../api/documents.api';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, ListRow, IconChip, LoadingView, EmptyState } from '../../components/ui';
import { colors, spacing } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const MIME_ICONS: Record<string, IoniconName> = {
  pdf: 'document-text-outline',
  image: 'image-outline',
};

function getMimeIcon(mimeType: string): IoniconName {
  if (mimeType.includes('pdf')) return MIME_ICONS.pdf;
  if (mimeType.includes('image')) return MIME_ICONS.image;
  return 'document-outline';
}

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
      <ListRow
        title={item.fileName}
        subtitle={`${formatBytes(item.fileSize)} · ${formatDate(item.uploadedAt)}`}
        leading={<IconChip icon={getMimeIcon(item.mimeType)} size={44} />}
        showChevron
        onPress={() => navigation.navigate('DocumentView', { doc: item })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        title={label}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title={`No ${label.toLowerCase()} documents yet`}
              actionLabel="Upload First Document"
              onAction={() => navigation.navigate('DocumentUpload', { presetCategory: category })}
            />
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
