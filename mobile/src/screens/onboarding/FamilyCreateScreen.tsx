import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { createFamily } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../theme';

export default function FamilyCreateScreen() {
  const { setFamilyId } = useAuth();
  const [familyName, setFamilyName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const isValid =
    familyName.trim().length >= 2 &&
    /^\d{4,6}$/.test(pin) &&
    pin === confirmPin;

  async function handleCreate() {
    if (!isValid) return;
    setLoading(true);
    try {
      const familyId = await createFamily(familyName.trim(), pin);
      setFamilyId(familyId);
      // AuthContext detects familyId → AppStack renders automatically
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create family vault');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your Family Vault</Text>
          <Text style={styles.subtitle}>Set a name and a secret PIN that family members will use to join</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Family Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sharma Family"
              placeholderTextColor={colors.textSecondary}
              value={familyName}
              onChangeText={setFamilyName}
              maxLength={40}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Family PIN (4–6 digits)</Text>
            <View style={styles.pinRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPin}
                keyboardType="number-pad"
                maxLength={6}
                value={pin}
                onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPin((s) => !s)}>
                <Text style={styles.eyeText}>{showPin ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Share this PIN privately with family members</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm PIN</Text>
            <TextInput
              style={[styles.input, confirmPin.length > 0 && pin !== confirmPin && styles.inputError]}
              placeholder="••••"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPin}
              keyboardType="number-pad"
              maxLength={6}
              value={confirmPin}
              onChangeText={(v) => setConfirmPin(v.replace(/\D/g, ''))}
            />
            {confirmPin.length > 0 && pin !== confirmPin && (
              <Text style={styles.errorText}>PINs do not match</Text>
            )}
          </View>

          <View style={styles.securityNote}>
            <Text style={styles.securityTitle}>🔒 How your PIN is protected</Text>
            <Text style={styles.securityBody}>
              Your PIN is hashed on our server before storage — it is never saved in plain text. Even we cannot read it.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create Family Vault</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl },
  field: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.error },
  pinRow: { flexDirection: 'row', gap: spacing.sm },
  eyeBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  eyeText: { fontSize: 18 },
  hint: { marginTop: spacing.xs, fontSize: fontSize.sm, color: colors.textSecondary },
  errorText: { marginTop: spacing.xs, fontSize: fontSize.sm, color: colors.error },
  securityNote: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  securityTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs },
  securityBody: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  footer: { padding: spacing.xl, paddingTop: 0 },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },
});
