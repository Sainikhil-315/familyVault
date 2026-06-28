import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  cacheDirectory,
  writeAsStringAsync,
  getInfoAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { getDownloadUrl } from '../../api/documents.api';
import { decryptFile, arrayBufferToBase64 } from '../../services/encryption';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'DocumentView'>;
  route: RouteProp<AppStackParamList, 'DocumentView'>;
};

type ViewState =
  | { status: 'loading'; message: string }
  | { status: 'image'; uri: string }
  | { status: 'pdf'; localUri: string }
  | { status: 'error'; message: string };

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function getCacheUri(r2Key: string, fileName: string): string {
  // Use UUID portion of r2Key as cache filename to avoid collisions
  const uuid = r2Key.split('/').pop() ?? 'doc';
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
  return `${cacheDirectory}${uuid}.${ext}`;
}

async function fetchAndDecrypt(
  r2Key: string,
  familyId: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const presignedUrl = await getDownloadUrl(r2Key, familyId);

  const response = await fetch(presignedUrl);
  if (!response.ok) throw new Error(`Failed to fetch document (${response.status})`);

  const encryptedBuffer = await response.arrayBuffer();
  const decryptedBuffer = await decryptFile(encryptedBuffer, familyId);
  const base64 = arrayBufferToBase64(decryptedBuffer);

  // Write decrypted file to app-private cache directory
  const cacheUri = getCacheUri(r2Key, fileName);
  await writeAsStringAsync(cacheUri, base64, {
    encoding: EncodingType.Base64,
  });

  return cacheUri;
}

export default function DocumentViewScreen({ navigation, route }: Props) {
  const { doc } = route.params;
  const { familyId } = useAuth();
  const [viewState, setViewState] = useState<ViewState>({ status: 'loading', message: 'Fetching document...' });

  const load = useCallback(async () => {
    if (!familyId) {
      setViewState({ status: 'error', message: 'Family context not found' });
      return;
    }

    try {
      setViewState({ status: 'loading', message: 'Fetching document...' });

      // Check if already cached (valid for ~14 min to stay under presigned URL TTL)
      const cacheUri = getCacheUri(doc.r2Key, doc.fileName);
      const cacheInfo = await getInfoAsync(cacheUri);
      const isCacheValid =
        cacheInfo.exists &&
        'modificationTime' in cacheInfo &&
        Date.now() - cacheInfo.modificationTime * 1000 < 14 * 60 * 1000;

      const localUri = isCacheValid
        ? cacheUri
        : await (async () => {
            setViewState({ status: 'loading', message: 'Decrypting document...' });
            return fetchAndDecrypt(doc.r2Key, familyId, doc.fileName, doc.mimeType);
          })();

      if (isImage(doc.mimeType)) {
        setViewState({ status: 'image', uri: localUri });
      } else {
        setViewState({ status: 'pdf', localUri });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load document';
      setViewState({ status: 'error', message: msg });
    }
  }, [familyId, doc]);

  useEffect(() => { load(); }, [load]);

  async function handleShare() {
    if (viewState.status !== 'image' && viewState.status !== 'pdf') return;
    const uri = viewState.status === 'image' ? viewState.uri : viewState.localUri;

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Sharing not available', 'Cannot share on this device.');
      return;
    }
    await Sharing.shareAsync(uri, { mimeType: doc.mimeType });
  }

  const isReady = viewState.status === 'image' || viewState.status === 'pdf';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.backText}>â† Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{doc.fileName}</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.headerBtn}
          disabled={!isReady}
        >
          <Text style={[styles.shareText, !isReady && styles.shareTextDisabled]}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {viewState.status === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.statusText}>{viewState.message}</Text>
            <Text style={styles.statusSub}>ðŸ”’ Decrypting on device</Text>
          </View>
        )}

        {viewState.status === 'error' && (
          <View style={styles.center}>
            <Text style={styles.errorIcon}>âš ï¸</Text>
            <Text style={styles.errorText}>{viewState.message}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {viewState.status === 'image' && (
          <ScrollView
            contentContainerStyle={styles.imageContainer}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: viewState.uri }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setViewState({ status: 'error', message: 'Failed to render image' })}
            />
          </ScrollView>
        )}

        {viewState.status === 'pdf' && Platform.OS === 'ios' && (
          <WebView
            source={{ uri: viewState.localUri }}
            style={styles.webview}
            onError={() => setViewState({ status: 'error', message: 'Failed to render PDF' })}
          />
        )}

        {viewState.status === 'pdf' && Platform.OS === 'android' && (
          <View style={styles.center}>
            <Text style={styles.pdfIcon}>ðŸ“„</Text>
            <Text style={styles.pdfFileName}>{doc.fileName}</Text>
            <Text style={styles.pdfSub}>
              Decrypted and ready. Tap Open to view in your PDF app.
            </Text>
            <TouchableOpacity style={styles.openBtn} onPress={handleShare}>
              <Text style={styles.openBtnText}>Open PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 60 },
  backText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '500' },
  headerTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text, textAlign: 'center' },
  shareText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '500', textAlign: 'right' },
  shareTextDisabled: { color: colors.textSecondary },
  content: { flex: 1 },
  webview: { flex: 1 },
  imageContainer: { flexGrow: 1, justifyContent: 'center', backgroundColor: '#000' },
  image: { width: '100%', height: undefined, aspectRatio: 1, maxHeight: 800 },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xxl, backgroundColor: colors.background, gap: spacing.md,
  },
  statusText: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  statusSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  errorIcon: { fontSize: 48 },
  errorText: { fontSize: fontSize.md, color: colors.text, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm, borderRadius: 10,
  },
  retryBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.md },
  pdfIcon: { fontSize: 64 },
  pdfFileName: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, textAlign: 'center' },
  pdfSub: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  openBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderRadius: 12,
  },
  openBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.lg },
});
