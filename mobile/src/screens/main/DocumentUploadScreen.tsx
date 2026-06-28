import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Modal, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { AppStackParamList } from '../../types/navigation';
import { uploadDocument } from '../../services/upload';
import { useAuth } from '../../contexts/AuthContext';
import { firestore } from '../../config/firebase';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'DocumentUpload'>;
  route: RouteProp<AppStackParamList, 'DocumentUpload'>;
};

const CATEGORIES = [
  { key: 'identity',  label: 'Identity',  icon: 'ðŸªª' },
  { key: 'property',  label: 'Property',  icon: 'ðŸ˜ï¸' },
  { key: 'financial', label: 'Financial', icon: 'ðŸ’°' },
  { key: 'medical',   label: 'Medical',   icon: 'ðŸ¥' },
  { key: 'education', label: 'Education', icon: 'ðŸŽ“' },
  { key: 'vehicle',   label: 'Vehicles',  icon: 'ðŸš—' },
  { key: 'other',     label: 'Other',     icon: 'ðŸ“„' },
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
      setProgress('Encrypting document...');
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
        'Document encrypted and saved to your family vault.',
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
    ? 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦ Entire Family'
    : selectedMember ? `ðŸ‘¤ ${selectedMember.name}` : 'Select...';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>â† Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Document</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* File selection */}
          <Text style={styles.sectionLabel}>1. Select File</Text>
          {selectedFile ? (
            <View style={styles.fileCard}>
              <Text style={styles.fileIcon}>
                {selectedFile.mimeType.includes('pdf') ? 'ðŸ“„' : 'ðŸ–¼ï¸'}
              </Text>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
                {selectedFile.size > 0 && (
                  <Text style={styles.fileSize}>{formatBytes(selectedFile.size)}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Text style={styles.removeText}>âœ•</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fileButtons}>
              <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
                <Text style={styles.fileBtnIcon}>ðŸ“</Text>
                <Text style={styles.fileBtnText}>Pick File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fileBtn} onPress={scanDocument}>
                <Text style={styles.fileBtnIcon}>ðŸ“·</Text>
                <Text style={styles.fileBtnText}>Scan Doc</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Category */}
          <Text style={styles.sectionLabel}>2. Category</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowCategoryModal(true)}>
            <Text style={styles.selectorText}>
              {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.label}` : 'Select category...'}
            </Text>
            <Text style={styles.selectorChevron}>â€º</Text>
          </TouchableOpacity>

          {/* Assign to */}
          <Text style={styles.sectionLabel}>3. Assign To</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowMemberModal(true)}>
            <Text style={styles.selectorText}>{belongsToLabel}</Text>
            <Text style={styles.selectorChevron}>â€º</Text>
          </TouchableOpacity>

          <View style={styles.encryptNote}>
            <Text style={styles.encryptIcon}>ðŸ”’</Text>
            <Text style={styles.encryptText}>
              Encrypted on device before upload. Only your family can read this file.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {uploading && progress ? (
            <Text style={styles.progressText}>{progress}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.uploadBtn, !canUpload && styles.uploadBtnDisabled]}
            onPress={handleUpload}
            disabled={!canUpload || uploading}
          >
            {uploading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.uploadBtnText}>Encrypt & Upload</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Category modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.modalItem, category === c.key && styles.modalItemSelected]}
                onPress={() => { setCategory(c.key); setShowCategoryModal(false); }}
              >
                <Text style={styles.modalItemIcon}>{c.icon}</Text>
                <Text style={[styles.modalItemText, category === c.key && styles.modalItemTextSelected]}>
                  {c.label}
                </Text>
                {category === c.key && <Text style={styles.checkmark}>âœ“</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member modal */}
      <Modal visible={showMemberModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Assign To</Text>
            <TouchableOpacity
              style={[styles.modalItem, belongsTo === 'family' && styles.modalItemSelected]}
              onPress={() => { setBelongsTo('family'); setShowMemberModal(false); }}
            >
              <Text style={styles.modalItemIcon}>ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦</Text>
              <Text style={[styles.modalItemText, belongsTo === 'family' && styles.modalItemTextSelected]}>
                Entire Family
              </Text>
              {belongsTo === 'family' && <Text style={styles.checkmark}>âœ“</Text>}
            </TouchableOpacity>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modalItem, belongsTo === m.id && styles.modalItemSelected]}
                onPress={() => { setBelongsTo(m.id); setShowMemberModal(false); }}
              >
                <Text style={styles.modalItemIcon}>ðŸ‘¤</Text>
                <View>
                  <Text style={[styles.modalItemText, belongsTo === m.id && styles.modalItemTextSelected]}>
                    {m.name}
                  </Text>
                  <Text style={styles.modalItemSub}>{m.phone}</Text>
                </View>
                {belongsTo === m.id && <Text style={styles.checkmark}>âœ“</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMemberModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  content: { padding: spacing.xl, gap: spacing.sm },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md },
  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primaryLight, borderRadius: 12, padding: spacing.md,
  },
  fileIcon: { fontSize: 28 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  fileSize: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  removeText: { color: colors.textSecondary, fontSize: 18, padding: spacing.xs },
  fileButtons: { flexDirection: 'row', gap: spacing.md },
  fileBtn: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg,
    alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  fileBtnIcon: { fontSize: 28 },
  fileBtnText: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  selector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  selectorText: { fontSize: fontSize.md, color: colors.text },
  selectorChevron: { fontSize: 20, color: colors.textSecondary },
  encryptNote: {
    flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primaryLight,
    borderRadius: 12, padding: spacing.md, marginTop: spacing.md,
  },
  encryptIcon: { fontSize: 18 },
  encryptText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  footer: { padding: spacing.xl, paddingTop: 0 },
  progressText: { fontSize: fontSize.sm, color: colors.primary, textAlign: 'center', marginBottom: spacing.sm },
  uploadBtn: {
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: 12, alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  modalItemSelected: { backgroundColor: colors.primaryLight },
  modalItemIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  modalItemText: { fontSize: fontSize.md, color: colors.text, flex: 1 },
  modalItemTextSelected: { color: colors.primary, fontWeight: '600' },
  modalItemSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  checkmark: { color: colors.primary, fontWeight: '700', fontSize: fontSize.lg },
  modalCancel: { marginTop: spacing.md, paddingVertical: spacing.md, alignItems: 'center' },
  modalCancelText: { color: colors.textSecondary, fontSize: fontSize.md },
});
