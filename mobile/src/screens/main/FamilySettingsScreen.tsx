import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { renameFamily, changeFamilyPin } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import { Screen, AppHeader, Text, Card, Input, Button } from '../../components/ui';
import { spacing } from '../../theme';

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
    <Screen
      keyboardAvoiding
      header={<AppHeader title="Family Settings" onBack={() => navigation.goBack()} />}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.section}>
        <Text variant="h2">Rename family</Text>
        <Input
          label="New family name"
          placeholder="New family name"
          value={newName}
          onChangeText={setNewName}
          maxLength={40}
          autoCapitalize="words"
        />
        <Button
          title="Rename"
          onPress={handleRename}
          loading={renamingLoading}
          disabled={renamingLoading}
        />
      </Card>

      <Card style={styles.section}>
        <Text variant="h2">Change PIN</Text>
        <Input
          label="Current PIN"
          placeholder="Current PIN"
          value={currentPin}
          onChangeText={setCurrentPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        <Input
          label="New PIN"
          placeholder="New PIN (4–6 digits)"
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        <Input
          label="Confirm new PIN"
          placeholder="Confirm new PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        <Button
          title="Change PIN"
          onPress={handleChangePin}
          loading={pinLoading}
          disabled={pinLoading}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  section: { gap: spacing.md },
});
