import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { listDocuments, DocumentMeta } from '../../api/documents.api';
import { Text, Avatar, SectionLabel, Icon, IconName } from '../../components/ui';
import { colors, spacing, radius, shadows, scaleFont } from '../../theme';
import { TAB_SCROLL_PADDING } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORY_ICONS: Record<string, IoniconName> = {
  identity: 'card-outline',
  property: 'home-outline',
  financial: 'wallet-outline',
  medical: 'medkit-outline',
  education: 'school-outline',
  vehicle: 'car-outline',
  other: 'document-text-outline',
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { role, canUpload, memberName, familyName, familyId } = useAuth();
  const isAdmin = role === 'admin';
  const showUpload = isAdmin || canUpload;

  const [recentDocs, setRecentDocs] = useState<DocumentMeta[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const firstName = memberName?.split(' ')[0] ?? 'there';

  const fetchRecent = useCallback(async () => {
    if (!familyId) return;
    setLoadingDocs(true);
    try {
      const docs = await listDocuments(familyId);
      setRecentDocs(docs.slice(0, 5));
    } catch {
      // silently fail — recent docs are non-critical
    } finally {
      setLoadingDocs(false);
    }
  }, [familyId]);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="h2">Good day, {firstName}</Text>
          {familyName ? (
            <Text variant="caption" color={colors.primary}>{familyName}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload CTA */}
        {showUpload && (
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.uploadCard}
            onPress={() => navigation.navigate('DocumentUpload', undefined)}
          >
            <View style={styles.uploadIconWrap}>
              <Icon name="cloud-upload-outline" size={26} color={colors.white} />
            </View>
            <View style={styles.uploadText}>
              <Text variant="bodyMedium" color={colors.white}>Upload Document</Text>
              <Text variant="caption" color="rgba(255,255,255,0.75)">Add to family vault</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}

        {/* Recent documents */}
        <SectionLabel>Recent Documents</SectionLabel>

        {!loadingDocs && recentDocs.length === 0 ? (
          <View style={styles.emptyDocs}>
            <Ionicons name="folder-open-outline" size={40} color={colors.textTertiary} />
            <Text variant="caption" center style={styles.emptyText}>
              No documents yet.{showUpload ? ' Upload one to get started.' : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.docList}>
            {recentDocs.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.7}
                style={styles.docRow}
                onPress={() => navigation.navigate('DocumentView', { doc })}
              >
                <View style={styles.docIcon}>
                  <Ionicons
                    name={doc.mimeType.includes('pdf') ? 'document-text-outline' : 'image-outline'}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text variant="bodyMedium" numberOfLines={1}>{doc.fileName}</Text>
                  <Text variant="caption">
                    {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)} · {formatBytes(doc.fileSize)} · {formatDate(doc.uploadedAt)}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: TAB_SCROLL_PADDING },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  uploadIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: { flex: 1 },
  emptyDocs: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyText: { color: colors.textSecondary },
  docList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: { flex: 1, gap: 2 },
});
