import React, { useState, useCallback, useRef } from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet, Alert, Platform,
  ScrollView, FlatList, Dimensions, Modal, ActivityIndicator,
  PanResponder, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  cacheDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  getInfoAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { getDownloadUrl, deleteDocument, DocumentPage } from '../../api/documents.api';
import { decryptFile, arrayBufferToBase64 } from '../../services/encryption';
import { useAuth } from '../../contexts/AuthContext';
import { Text, LoadingView, ErrorView, Icon } from '../../components/ui';
import { colors, spacing, layout } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'DocumentView'>;
  route: RouteProp<AppStackParamList, 'DocumentView'>;
};

type PageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'image'; uri: string }
  | { status: 'pdf'; uri: string }
  | { status: 'error'; message: string };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) { onClose(); translateY.setValue(0); }
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const handleClose = useCallback(() => { translateY.setValue(0); onClose(); }, [onClose, translateY]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
        <Animated.View
          style={[styles.shareSheet, { transform: [{ translateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handleBar} />
          </View>
          {children}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

function getCacheUri(r2Key: string, fileName: string): string {
  const uuid = r2Key.split('/').pop() ?? 'doc';
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
  return `${cacheDirectory}${uuid}.${ext}`;
}

async function fetchAndDecryptPage(
  r2Key: string,
  familyId: string,
  fileName: string
): Promise<string> {
  const cacheUri = getCacheUri(r2Key, fileName);
  const info = await getInfoAsync(cacheUri);
  const isCacheValid =
    info.exists &&
    'modificationTime' in info &&
    Date.now() - info.modificationTime * 1000 < 14 * 60 * 1000;

  if (isCacheValid) return cacheUri;

  const presignedUrl = await getDownloadUrl(r2Key, familyId);
  const response = await fetch(presignedUrl);
  if (!response.ok) throw new Error(`Failed to fetch page (${response.status})`);

  const encryptedBuffer = await response.arrayBuffer();
  const decryptedBuffer = await decryptFile(encryptedBuffer, familyId);
  await writeAsStringAsync(cacheUri, arrayBufferToBase64(decryptedBuffer), {
    encoding: EncodingType.Base64,
  });
  return cacheUri;
}

// Backward compat: convert old single-file docs to pages[] format
function getPages(doc: AppStackParamList['DocumentView']['doc']): DocumentPage[] {
  if (doc.pages && doc.pages.length > 0) return doc.pages;
  const legacy = doc as unknown as { r2Key?: string; fileName?: string; mimeType?: string; fileSize?: number };
  if (legacy.r2Key) {
    return [{
      r2Key: legacy.r2Key,
      fileName: legacy.fileName ?? 'document',
      mimeType: legacy.mimeType ?? 'application/octet-stream',
      fileSize: legacy.fileSize ?? 0,
      pageIndex: 0,
    }];
  }
  return [];
}

export default function DocumentViewScreen({ navigation, route }: Props) {
  const { doc } = route.params;
  const { familyId, role } = useAuth();
  const isAdmin = role === 'admin';
  const pages = getPages(doc);

  const [pageStates, setPageStates] = useState<PageState[]>(() => pages.map(() => ({ status: 'idle' })));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadPage = useCallback(async (index: number) => {
    if (!familyId) return;
    if (pageStates[index]?.status === 'image' || pageStates[index]?.status === 'pdf') return;

    setPageStates((prev) => {
      const next = [...prev];
      next[index] = { status: 'loading' };
      return next;
    });

    const page = pages[index];
    try {
      const localUri = await fetchAndDecryptPage(page.r2Key, familyId, page.fileName);
      setPageStates((prev) => {
        const next = [...prev];
        next[index] = page.mimeType.startsWith('image/')
          ? { status: 'image', uri: localUri }
          : { status: 'pdf', uri: localUri };
        return next;
      });
    } catch (err) {
      setPageStates((prev) => {
        const next = [...prev];
        next[index] = { status: 'error', message: err instanceof Error ? err.message : 'Failed to load page' };
        return next;
      });
    }
  }, [familyId, pages, pageStates]);

  // Load first page on mount
  React.useEffect(() => { loadPage(0); }, []);

  function onViewableItemsChanged({ viewableItems }: { viewableItems: { index: number | null }[] }) {
    const idx = viewableItems[0]?.index ?? 0;
    setCurrentIndex(idx);
    loadPage(idx);
    // Pre-load next page
    if (idx + 1 < pages.length) loadPage(idx + 1);
  }

  async function handleDelete() {
    if (!familyId) return;
    Alert.alert('Delete Document', `Delete "${doc.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(doc.id, familyId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete document');
          }
        },
      },
    ]);
  }

  async function shareAsPDF() {
    if (!familyId) return;
    setShareLoading(true);
    setShowShareSheet(false);
    try {
      // Load all pages
      const uris: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        const uri = await fetchAndDecryptPage(pages[i].r2Key, familyId, pages[i].fileName);
        uris.push(uri);
      }

      // Build HTML with each page as a full-width image
      const htmlPages = await Promise.all(
        uris.map(async (uri, i) => {
          const page = pages[i];
          if (page.mimeType.startsWith('image/')) {
            const b64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
            const ext = page.mimeType.split('/')[1] ?? 'jpeg';
            return `<img src="data:${page.mimeType};base64,${b64}" style="width:100%;display:block;page-break-after:always;"/>`;
          }
          // PDF pages: can't inline — skip with note
          return `<p style="text-align:center;padding:40px;font-size:16px;">Page ${i + 1}: PDF (open in PDF app)</p>`;
        })
      );

      const html = `<!DOCTYPE html><html><head><style>body{margin:0;padding:0}img{max-width:100%}</style></head><body>${htmlPages.join('')}</body></html>`;

      // base64:true avoids Android FileProvider path issues — get PDF as string,
      // write directly to cacheDirectory which expo-sharing can always access.
      const { base64: pdfBase64 } = await Print.printToFileAsync({ html, base64: true });
      const safeName = doc.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const shareUri = `${cacheDirectory}${safeName}.pdf`;
      await writeAsStringAsync(shareUri, pdfBase64!, { encoding: EncodingType.Base64 });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing not available', 'Cannot share files on this device.');
        return;
      }
      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/pdf',
        dialogTitle: doc.name,
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      Alert.alert('Share Failed', err instanceof Error ? err.message : 'Could not generate PDF');
    } finally {
      setShareLoading(false);
    }
  }

  async function shareOriginal() {
    setShowShareSheet(false);
    const ps = pageStates[currentIndex];
    if (ps.status !== 'image' && ps.status !== 'pdf') return;
    const uri = ps.uri;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) { Alert.alert('Sharing not available'); return; }
    await Sharing.shareAsync(uri, { mimeType: pages[currentIndex].mimeType });
  }

  function renderPage({ item, index }: { item: DocumentPage; index: number }) {
    const ps = pageStates[index] ?? { status: 'idle' };
    return (
      <View style={styles.pageSlide}>
        {(ps.status === 'idle' || ps.status === 'loading') && (
          <View style={styles.pageCenter}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
              Loading page {index + 1}...
            </Text>
          </View>
        )}
        {ps.status === 'error' && (
          <View style={styles.pageCenter}>
            <Icon name="alert-circle-outline" size={40} color={colors.error} />
            <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
              {ps.message}
            </Text>
            <TouchableOpacity onPress={() => loadPage(index)} style={{ marginTop: spacing.md }}>
              <Text variant="bodyMedium" color={colors.primary}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {ps.status === 'image' && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: ps.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
        {ps.status === 'pdf' && Platform.OS === 'ios' && (
          <WebView source={{ uri: ps.uri }} style={styles.webview} />
        )}
        {ps.status === 'pdf' && Platform.OS === 'android' && (
          <View style={styles.pageCenter}>
            <Icon name="document-text-outline" size={48} color={colors.primary} />
            <Text variant="bodyMedium" style={{ marginTop: spacing.md }}>{item.fileName}</Text>
            <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
              Tap Share → Share as PDF to open
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={layout.hitSlop}>
          <Icon name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text variant="bodyMedium" numberOfLines={1} center>{doc.name}</Text>
          {pages.length > 1 && (
            <Text variant="caption" center color={colors.textSecondary}>
              {currentIndex + 1} / {pages.length}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {shareLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <TouchableOpacity onPress={() => setShowShareSheet(true)} hitSlop={layout.hitSlop}>
              <Icon name="share-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity onPress={handleDelete} hitSlop={layout.hitSlop} style={styles.deleteBtn}>
              <Icon name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Page pager */}
      <FlatList
        ref={flatListRef}
        data={pages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={styles.pager}
      />

      {/* Page dots */}
      {pages.length > 1 && (
        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
      )}

      {/* Share bottom sheet */}
      <BottomSheet visible={showShareSheet} onClose={() => setShowShareSheet(false)}>
        <Text variant="h2" style={styles.shareTitle}>Share "{doc.name}"</Text>
        <TouchableOpacity style={styles.shareOption} onPress={shareAsPDF} activeOpacity={0.7}>
          <View style={styles.shareOptionIcon}>
            <Icon name="document-text-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium">Share as PDF</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {pages.length > 1 ? `All ${pages.length} pages in one PDF` : 'Convert to PDF and share'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
        {pages.length === 1 && pages[0].mimeType.startsWith('image/') && (
          <TouchableOpacity style={styles.shareOption} onPress={shareOriginal} activeOpacity={0.7}>
            <View style={styles.shareOptionIcon}>
              <Icon name="image-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">Share as Image</Text>
              <Text variant="caption" color={colors.textSecondary}>Share original JPEG/PNG file</Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minHeight: layout.headerHeight,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerBtn: { minWidth: 44, justifyContent: 'center' },
  headerMid: { flex: 1, alignItems: 'center' },
  headerRight: {
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  deleteBtn: { padding: 2 },
  pager: { flex: 1 },
  pageSlide: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: colors.black,
  },
  pageCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  imageContainer: { flex: 1, backgroundColor: colors.black },
  image: { width: SCREEN_WIDTH, flex: 1 },
  webview: { flex: 1 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 16 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  shareSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  shareTitle: { marginBottom: spacing.md },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  shareOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareCancel: { marginTop: spacing.md, paddingVertical: spacing.md, alignItems: 'center' },
  handleArea: { paddingVertical: 12, alignItems: 'center' },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
});
