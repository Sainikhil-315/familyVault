import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { signInWithCustomToken } from 'firebase/auth';
import { OnboardingStackParamList } from '../../types/navigation';
import { verifyPin } from '../../api/family.api';
import { submitJoinRequest } from '../../api/family.api';
import { firebaseAuth } from '../../config/firebase';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'FamilyPIN'>;
  route: RouteProp<OnboardingStackParamList, 'FamilyPIN'>;
};

export default function FamilyPINScreen({ navigation, route }: Props) {
  const { phone, familyId, familyName } = route.params;
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2 && /^\d{4,6}$/.test(pin);

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    try {
      // Verify PIN and get custom token for Firebase sign-in
      const result = await verifyPin(familyId, pin, phone);

      if (!result.customToken) {
        Alert.alert('Error', 'Could not authenticate. Please try again.');
        return;
      }

      // Sign into Firebase
      await signInWithCustomToken(firebaseAuth, result.customToken);

      // Submit join request (now authenticated)
      await submitJoinRequest(familyId, name.trim());

      navigation.navigate('JoinPending');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg.toLowerCase().includes('pin') || msg.toLowerCase().includes('incorrect')) {
        setPin('');
        Alert.alert('Wrong PIN', 'Incorrect family PIN. Please try again.');
      } else {
        Alert.alert('Error', msg);
      }
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
          <Text style={styles.title}>Join {familyName}</Text>
          <Text style={styles.subtitle}>Enter your name and the family PIN shared by the admin</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ravi Sharma"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={40}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Family PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 4–6 digit PIN"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              value={pin}
              onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
            />
            <Text style={styles.hint}>Ask the family admin for this PIN</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Request to Join</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.md },
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
  hint: { marginTop: spacing.xs, fontSize: fontSize.sm, color: colors.textSecondary },
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
