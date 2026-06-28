import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { createFamily } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import { Screen, AppHeader, Text, Button, Input } from '../../components/ui';
import { spacing } from '../../theme';

export default function FamilyCreateScreen() {
  const { setFamilyId, refreshAuth } = useAuth();
  const [adminName, setAdminName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const isValid =
    adminName.trim().length >= 2 &&
    familyName.trim().length >= 2 &&
    /^\d{4,6}$/.test(pin) &&
    pin === confirmPin;

  async function handleCreate() {
    if (!isValid) return;
    setLoading(true);
    try {
      const familyId = await createFamily(familyName.trim(), pin, adminName.trim());
      setFamilyId(familyId);
      await refreshAuth();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create family vault');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      keyboardAvoiding
      header={<AppHeader title="Create Family Vault" />}
      footer={
        <View style={styles.footer}>
          <Button title="Create Family Vault" onPress={handleCreate} loading={loading} disabled={!isValid} />
        </View>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">Set up your vault</Text>
        <Text variant="body" muted>
          Enter your name, a family name, and a PIN that members will use to join
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Your Name"
          placeholder="e.g. Nikhil Sharma"
          value={adminName}
          onChangeText={setAdminName}
          maxLength={40}
          autoFocus
        />

        <Input
          label="Family Name"
          placeholder="e.g. Sharma Family"
          value={familyName}
          onChangeText={setFamilyName}
          maxLength={40}
        />

        <Input
          label="Family PIN (4–6 digits)"
          placeholder="••••"
          secureTextEntry={!showPin}
          keyboardType="number-pad"
          maxLength={6}
          value={pin}
          onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
          hint="Share this PIN privately with family members"
          right={
            <Button
              title={showPin ? 'Hide' : 'Show'}
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => setShowPin((s) => !s)}
            />
          }
        />

        <Input
          label="Confirm PIN"
          placeholder="••••"
          secureTextEntry={!showPin}
          keyboardType="number-pad"
          maxLength={6}
          value={confirmPin}
          onChangeText={(v) => setConfirmPin(v.replace(/\D/g, ''))}
          error={confirmPin.length > 0 && pin !== confirmPin ? 'PINs do not match' : null}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.xl },
  form: { gap: spacing.lg },
  footer: { padding: spacing.lg },
});
