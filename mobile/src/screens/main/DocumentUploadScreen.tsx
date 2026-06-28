import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView,
  PanResponder, Animated,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { AppStackParamList } from '../../types/navigation';
import { uploadMultiPageDocument } from '../../services/upload';
import { useAuth } from '../../contexts/AuthContext';
import { firestore } from '../../config/firebase';
import {
  Screen, AppHeader, Text, Button, Card, SectionLabel, Icon, Input,
} from '../../components/ui';
import { colors, spacing, radius, scaleFont } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'DocumentUpload'>;
  route: RouteProp<AppStackParamList, 'DocumentUpload'>;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORIES: { key: string; label: string; icon: IoniconName }[] = [
  { key: 'identity',  label: 'Identity',  icon: 'card-outline' },
  { key: 'property',  label: 'Property',  icon: 'home-outline' },
  { key: 'financial', label: 'Financial', icon: 'wallet-outline' },
  { key: 'medical',   label: 'Medical',   icon: 'medkit-outline' },
  { key: 'education', label: 'Education', icon: 'school-outline' },
  { key: 'vehicle',   label: 'Vehicles',  icon: 'car-outline' },
  { key: 'other',     label: 'Other',     icon: 'document-text-outline' },
];

const MAX_PAGES = 20;

interface PageFile {
  uri: string;
  fileName: string;
  mimeType: string;
  size: number;
}

interface FamilyMember {
  id: string;
  name: string;
  phone: string;
}

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
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          onClose();
          translateY.setValue(0);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const handleClose = useCallback(() => {
    translateY.setValue(0);
    onClose();
  }, [onClose, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
        <Animated.View
          style={[styles.modalSheet, { transform: [{ translateY }] }]}
          onStartShouldSetResponder={() => true}
          // stop tap propagation to backdrop
        >
          {/* Drag handle */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handleBar} />
          </View>
          {children}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pageIcon(mimeType: string): IoniconName {
  if (mimeType.includes('pdf')) return 'document-text-outline';
  if (mimeType.startsWith('image/')) return 'image-outline';
  return 'document-outline';
}

export default function DocumentUploadScreen({ navigation, route }: Props) {
  const { familyId } = useAuth();
  const presetCategory = route.params?.presetCategory;

  const [pages, setPages] = useState<PageFile[]>([]);
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState<string>(presetCategory ?? '');
  const [belongsTo, setBelongsTo] = useState<string>('family');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    getDocs(collection(firestore, 'families', familyId, 'members')).then((snap) => {
      const active = snap.docs
        .filter((d) => d.data().status === 'active')
        .map((d) => ({ id: d.id, name: d.data().name as string, phone: d.data().phone as string }));
      setMembers(active);
    });
  }, [familyId]);

  function addPages(newPages: PageFile[]) {
    setPages((prev) => {
      const combined = [...prev, ...newPages];
      if (combined.length > MAX_PAGES) {
        Alert.alert('Limit reached', `Maximum ${MAX_PAGES} pages per document.`);
        return combined.slice(0, MAX_PAGES);
      }
      return combined;
    });
  }

  function removePage(index: number) {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }

  async function pickPages() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled || !result.assets?.length) return;
      addPages(result.assets.map((a) => ({
        uri: a.uri,
        fileName: a.name,
        mimeType: a.mimeType ?? 'application/octet-stream',
        size: a.size ?? 0,
      })));
    } catch {
      Alert.alert('Error', 'Could not open file picker.');
    }
  }

  async function scanPage() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Camera access is needed to scan documents.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    addPages([{
      uri: asset.uri,
      fileName: `scan_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      size: asset.fileSize ?? 0,
    }]);
  }

  const canUpload = pages.length > 0 && docName.trim().length >= 1 && category && familyId;

  async function handleUpload() {
    if (!canUpload || !familyId) return;
    setUploading(true);
    try {
      await uploadMultiPageDocument({
        pages,
        docName: docName.trim(),
        familyId,
        category,
        belongsTo,
        onProgress: (current, total) => setProgress(`Uploading page ${current} of ${total}...`),
      });
      setProgress('');
      Alert.alert('Uploaded', 'Document saved to your family vault.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setProgress('');
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  const selectedCategory = CATEGORIES.find((c) => c.key === category);
  const selectedMember = members.find((m) => m.id === belongsTo);
  const belongsToLabel = belongsTo === 'family'
    ? 'Entire Family'
    : selectedMember ? selectedMember.name : 'Select...';

  return (
    <Screen
      padded={false}
      keyboardAvoiding
      header={<AppHeader title="Upload Document" onBack={() => navigation.goBack()} />}
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footer}>
          {uploading && progress ? (
            <Text variant="caption" color={colors.primary} center style={styles.progressText}>
              {progress}
            </Text>
          ) : null}
          <Button
            title={pages.length > 1 ? `Upload ${pages.length} pages` : 'Upload'}
            onPress={handleUpload}
            loading={uploading}
            disabled={!canUpload}
          />
        </View>
      }
    >
      {/* Pages section */}
      <SectionLabel>1. Pages {pages.length > 0 ? `(${pages.length})` : ''}</SectionLabel>

      {pages.map((page, index) => (
        <View key={`${page.uri}-${index}`} style={styles.pageRow}>
          <View style={styles.pageNum}>
            <Text variant="caption" color={colors.textSecondary}>{index + 1}</Text>
          </View>
          <View style={styles.pageIconWrap}>
            <Icon name={pageIcon(page.mimeType)} size={20} color={colors.primary} />
          </View>
          <View style={styles.pageInfo}>
            <Text variant="bodyMedium" numberOfLines={1}>{page.fileName}</Text>
            {page.size > 0 && <Text variant="caption">{formatBytes(page.size)}</Text>}
          </View>
          <TouchableOpacity onPress={() => removePage(index)} hitSlop={8}>
            <Icon name="close-circle-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      ))}

      {pages.length < MAX_PAGES && (
        <View style={styles.addPageRow}>
          <TouchableOpacity style={styles.addPageBtn} onPress={scanPage} activeOpacity={0.7}>
            <View style={styles.addPageIcon}>
              <Icon name="camera-outline" size={22} color={colors.primary} />
            </View>
            <Text variant="caption">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPageBtn} onPress={pickPages} activeOpacity={0.7}>
            <View style={styles.addPageIcon}>
              <Icon name="folder-open-outline" size={22} color={colors.primary} />
            </View>
            <Text variant="caption">Pick File</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Document name */}
      <SectionLabel style={styles.sectionSpacer}>2. Document Name</SectionLabel>
      <Input
        placeholder="e.g. Aadhaar Card, Passport..."
        value={docName}
        onChangeText={setDocName}
        maxLength={60}
        autoCapitalize="words"
      />

      {/* Category */}
      <SectionLabel style={styles.sectionSpacer}>3. Category</SectionLabel>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowCategoryModal(true)}>
        <Card style={styles.selector} elevation="flat">
          {selectedCategory ? (
            <View style={styles.selectorContent}>
              <View style={styles.selectorIcon}>
                <Icon name={selectedCategory.icon} size={18} color={colors.primary} />
              </View>
              <Text variant="body">{selectedCategory.label}</Text>
            </View>
          ) : (
            <Text variant="body" style={styles.placeholder}>Select category...</Text>
          )}
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </Card>
      </TouchableOpacity>

      {/* Assign to */}
      <SectionLabel style={styles.sectionSpacer}>4. Assign To</SectionLabel>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowMemberModal(true)}>
        <Card style={styles.selector} elevation="flat">
          <View style={styles.selectorContent}>
            <View style={styles.selectorIcon}>
              <Icon
                name={belongsTo === 'family' ? 'people-outline' : 'person-outline'}
                size={18}
                color={colors.primary}
              />
            </View>
            <Text variant="body">{belongsToLabel}</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </Card>
      </TouchableOpacity>

      {/* Category bottom sheet */}
      <BottomSheet visible={showCategoryModal} onClose={() => setShowCategoryModal(false)}>
        <Text variant="h2" style={styles.modalTitle}>Select Category</Text>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.modalItem, category === c.key && styles.modalItemSelected]}
            onPress={() => { setCategory(c.key); setShowCategoryModal(false); }}
          >
            <View style={[styles.modalItemIcon, category === c.key && styles.modalItemIconSelected]}>
              <Icon name={c.icon} size={20} color={category === c.key ? colors.primary : colors.textSecondary} />
            </View>
            <Text
              variant={category === c.key ? 'bodyMedium' : 'body'}
              color={category === c.key ? colors.primary : undefined}
              style={styles.modalItemText}
            >
              {c.label}
            </Text>
            {category === c.key && <Icon name="checkmark" size={18} color={colors.primary} />}
          </TouchableOpacity>
        ))}
      </BottomSheet>

      {/* Assign To bottom sheet */}
      <BottomSheet visible={showMemberModal} onClose={() => setShowMemberModal(false)}>
        <Text variant="h2" style={styles.modalTitle}>Assign To</Text>
        <TouchableOpacity
          style={[styles.modalItem, belongsTo === 'family' && styles.modalItemSelected]}
          onPress={() => { setBelongsTo('family'); setShowMemberModal(false); }}
        >
          <View style={[styles.modalItemIcon, belongsTo === 'family' && styles.modalItemIconSelected]}>
            <Icon name="people-outline" size={20} color={belongsTo === 'family' ? colors.primary : colors.textSecondary} />
          </View>
          <Text
            variant={belongsTo === 'family' ? 'bodyMedium' : 'body'}
            color={belongsTo === 'family' ? colors.primary : undefined}
            style={styles.modalItemText}
          >
            Entire Family
          </Text>
          {belongsTo === 'family' && <Icon name="checkmark" size={18} color={colors.primary} />}
        </TouchableOpacity>
        {members.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modalItem, belongsTo === m.id && styles.modalItemSelected]}
            onPress={() => { setBelongsTo(m.id); setShowMemberModal(false); }}
          >
            <View style={[styles.modalItemIcon, belongsTo === m.id && styles.modalItemIconSelected]}>
              <Icon name="person-outline" size={20} color={belongsTo === m.id ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.modalItemText}>
              <Text
                variant={belongsTo === m.id ? 'bodyMedium' : 'body'}
                color={belongsTo === m.id ? colors.primary : undefined}
              >
                {m.name}
              </Text>
              <Text variant="caption">{m.phone}</Text>
            </View>
            {belongsTo === m.id && <Icon name="checkmark" size={18} color={colors.primary} />}
          </TouchableOpacity>
        ))}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  sectionSpacer: { marginTop: spacing.md },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pageNum: {
    width: 22,
    alignItems: 'center',
  },
  pageIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageInfo: { flex: 1, gap: 2 },
  addPageRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addPageBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
  },
  addPageIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  selectorContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectorIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: { color: colors.textTertiary },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  progressText: { marginBottom: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: { marginBottom: spacing.md },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  modalItemSelected: { backgroundColor: colors.primaryLight },
  modalItemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#F0F4F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemIconSelected: { backgroundColor: 'rgba(255,255,255,0.7)' },
  modalItemText: { flex: 1 },
  modalCancel: { marginTop: spacing.md, paddingVertical: spacing.md, alignItems: 'center' },
  handleArea: { paddingVertical: 12, alignItems: 'center' },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
});
