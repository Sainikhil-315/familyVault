import React, { useState, useEffect } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Alert, Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { AppStackParamList } from '../../types/navigation';
import { uploadDocument } from '../../services/upload';
import { useAuth } from '../../contexts/AuthContext';
import { firestore } from '../../config/firebase';
import {
  Screen, AppHeader, Text, Button, Card, IconChip, SectionLabel,
} from '../../components/ui';
import { colors, spacing, radius, scaleFont } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'DocumentUpload'>;
  route: RouteProp<AppStackParamList, 'DocumentUpload'>;
};

const CATEGORIES = [
  { key: 'identity',  label: 'Identity',  icon: '🪪' },
  { key: 'property',  label: 'Property',  icon: '🏘️' },
  { key: 'financial', label: 'Financial', icon: '💰' },
  { key: 'medical',   label: 'Medical',   icon: '🏥' },
  { key: 'education', label: 'Education', icon: '🎓' },
  { key: 'vehicle',   label: 'Vehicles',  icon: '🚗' },
  { key: 'other',     label: 'Other',     icon: '📄' },
] as const;

interface FamilyMember {
  id: string;
  name: string;
  phone: string;
}

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploadScreen({ navigation, route }: Props) {
  const { familyId, user } = useAuth();
  const presetCategory = route.params?.presetCategory;

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [category, setCategory] = useState<string>(presetCategory ?? '');
  const [belongsTo, setBelongsTo] = useState<string>('family');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    if (!familyId) return;
    getDocs(collection(firestore, 'families', familyId, 'members')).then((snap) => {
      const active = snap.docs
        .filter((d) => d.data().status === 'active')
        .map((d) => ({ id: d.id, name: d.data().name as string, phone: d.data().phone as string }));
      setMembers(active);
    });
  }, [familyId]);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setSelectedFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      size: asset.size ?? 0,
    });
  }

  async function scanDocument() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Camera access is needed to scan documents.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const name = `scan_${Date.now()}.jpg`;
    setSelectedFile({
      uri: asset.uri,
      name,
      mimeType: 'image/jpeg',
      size: asset.fileSize ?? 0,
    });
  }

  const canUpload = selectedFile && category && belongsTo && familyId;

  async function handleUpload() {
    if (!canUpload || !familyId) return;
    setUploading(true);
    try {
      setProgress('Uploading...');
      const result = await uploadDocument({
        fileUri: selectedFile.uri,
        fileName: selectedFile.name,
        mimeType: selectedFile.mimeType,
        familyId,
        category,
        belongsTo,
      });
      setProgress('');
      Alert.alert(
        'Uploaded',
        'Document saved to your family vault.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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
    ? '👨‍👩‍👧‍👦 Entire Family'
    : selectedMember ? `👤 ${selectedMember.name}` : 'Select...';

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
            title="Upload"
            onPress={handleUpload}
            loading={uploading}
            disabled={!canUpload}
          />
        </View>
      }
    >
      {/* File selection */}
      <SectionLabel>1. Select File</SectionLabel>
      {selectedFile ? (
        <Card style={styles.fileCard} elevation="flat">
          <Text style={styles.fileIcon}>
            {selectedFile.mimeType.includes('pdf') ? '📄' : '🖼️'}
          </Text>
          <View style={styles.fileInfo}>
            <Text variant="bodyMedium" numberOfLines={2}>{selectedFile.name}</Text>
            {selectedFile.size > 0 && (
              <Text variant="caption" style={styles.fileSize}>{formatBytes(selectedFile.size)}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setSelectedFile(null)} hitSlop={8}>
            <Text variant="title" color={colors.textSecondary}>✕</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <View style={styles.fileButtons}>
          <Card onPress={pickFile} style={styles.fileBtn}>
            <Text style={styles.fileBtnIcon}>📁</Text>
            <Text variant="bodyMedium">Pick File</Text>
          </Card>
          <Card onPress={scanDocument} style={styles.fileBtn}>
            <Text style={styles.fileBtnIcon}>📷</Text>
            <Text variant="bodyMedium">Scan Doc</Text>
          </Card>
        </View>
      )}

      {/* Category */}
      <SectionLabel style={styles.sectionSpacer}>2. Category</SectionLabel>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowCategoryModal(true)}>
        <Card style={styles.selector} elevation="flat">
          <Text variant="body">
            {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.label}` : 'Select category...'}
          </Text>
          <Text style={styles.selectorChevron}>›</Text>
        </Card>
      </TouchableOpacity>

      {/* Assign to */}
      <SectionLabel style={styles.sectionSpacer}>3. Assign To</SectionLabel>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowMemberModal(true)}>
        <Card style={styles.selector} elevation="flat">
          <Text variant="body">{belongsToLabel}</Text>
          <Text style={styles.selectorChevron}>›</Text>
        </Card>
      </TouchableOpacity>

      {/* Category modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text variant="h2" style={styles.modalTitle}>Select Category</Text>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.modalItem, category === c.key && styles.modalItemSelected]}
                onPress={() => { setCategory(c.key); setShowCategoryModal(false); }}
              >
                <Text style={styles.modalItemIcon}>{c.icon}</Text>
                <Text
                  variant={category === c.key ? 'bodyMedium' : 'body'}
                  color={category === c.key ? colors.primary : undefined}
                  style={styles.modalItemText}
                >
                  {c.label}
                </Text>
                {category === c.key && <Text variant="title" color={colors.primary}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCategoryModal(false)}>
              <Text variant="body" muted>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member modal */}
      <Modal visible={showMemberModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text variant="h2" style={styles.modalTitle}>Assign To</Text>
            <TouchableOpacity
              style={[styles.modalItem, belongsTo === 'family' && styles.modalItemSelected]}
              onPress={() => { setBelongsTo('family'); setShowMemberModal(false); }}
            >
              <Text style={styles.modalItemIcon}>👨‍👩‍👧‍👦</Text>
              <Text
                variant={belongsTo === 'family' ? 'bodyMedium' : 'body'}
                color={belongsTo === 'family' ? colors.primary : undefined}
                style={styles.modalItemText}
              >
                Entire Family
              </Text>
              {belongsTo === 'family' && <Text variant="title" color={colors.primary}>✓</Text>}
            </TouchableOpacity>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modalItem, belongsTo === m.id && styles.modalItemSelected]}
                onPress={() => { setBelongsTo(m.id); setShowMemberModal(false); }}
              >
                <Text style={styles.modalItemIcon}>👤</Text>
                <View style={styles.modalItemText}>
                  <Text
                    variant={belongsTo === m.id ? 'bodyMedium' : 'body'}
                    color={belongsTo === m.id ? colors.primary : undefined}
                  >
                    {m.name}
                  </Text>
                  <Text variant="caption">{m.phone}</Text>
                </View>
                {belongsTo === m.id && <Text variant="title" color={colors.primary}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMemberModal(false)}>
              <Text variant="body" muted>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  sectionSpacer: { marginTop: spacing.md },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    padding: spacing.md,
  },
  fileIcon: { fontSize: scaleFont(28) },
  fileInfo: { flex: 1 },
  fileSize: { marginTop: 2 },
  fileButtons: { flexDirection: 'row', gap: spacing.md },
  fileBtn: { flex: 1, alignItems: 'center', gap: spacing.sm },
  fileBtnIcon: { fontSize: scaleFont(28) },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  selectorChevron: { fontSize: scaleFont(20), color: colors.textTertiary },
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
  modalItemIcon: { fontSize: scaleFont(22), width: 32, textAlign: 'center' },
  modalItemText: { flex: 1 },
  modalCancel: { marginTop: spacing.md, paddingVertical: spacing.md, alignItems: 'center' },
});
