import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { renameFamily, changeFamilyPin } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, radius } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'FamilySettings'>;
};

export default function FamilySettingsScreen({ navigation }: Props) {
  const { familyId } = useAuth();

  const [newName, setNewName] = useState('');
  const [renamingLoading, setRenamingLoading] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  async function handleRename() {
    if (!familyId) return;
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      Alert.alert('Invalid name', 'Family name must be at least 2 characters.');
      return;
    }
    setRenamingLoading(true);
    try {
      await renameFamily(familyId, trimmed);
      setNewName('');
      Alert.alert('Done', `Family renamed to "${trimmed}".`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to rename family');
    } finally {
      setRenamingLoading(false);
    }
  }

  async function handleChangePin() {
    if (!familyId) return;
    if (!/^\d{4,6}$/.test(currentPin)) {
      Alert.alert('Invalid PIN', 'Current PIN must be 4–6 digits.');
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'New PIN must be 4–6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Mismatch', 'New PIN and confirmation do not match.');
      return;
    }
    if (currentPin === newPin) {
      Alert.alert('Same PIN', 'New PIN must differ from current PIN.');
      return;
    }
    setPinLoading(true);
    try {
      await changeFamilyPin(familyId, currentPin, newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      Alert.alert('Done', 'PIN updated successfully.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to change PIN');
    } finally {
      setPinLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Rename */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rename Family</Text>
          <TextInput
            style={styles.input}
            placeholder="New family name"
            placeholderTextColor={colors.textSecondary}
            value={newName}
            onChangeText={setNewName}
            maxLength={40}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.btn, renamingLoading && styles.btnDisabled]}
            onPress={handleRename}
            disabled={renamingLoading}
          >
            {renamingLoading
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.btnText}>Rename</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.dividerFull} />

        {/* Change PIN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Current PIN"
            placeholderTextColor={colors.textSecondary}
            value={currentPin}
            onChangeText={setCurrentPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <TextInput
            style={styles.input}
            placeholder="New PIN (4–6 digits)"
            placeholderTextColor={colors.textSecondary}
            value={newPin}
            onChangeText={setNewPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new PIN"
            placeholderTextColor={colors.textSecondary}
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.btn, pinLoading && styles.btnDisabled]}
            onPress={handleChangePin}
            disabled={pinLoading}
          >
            {pinLoading
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.btnText}>Change PIN</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backBtn: { width: 60 },
  backText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '500' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  content: { padding: spacing.xl, gap: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: {
    fontSize: fontSize.md, fontWeight: '700', color: colors.text,
  },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: fontSize.md, color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
  dividerFull: { height: 1, backgroundColor: colors.border },
});
