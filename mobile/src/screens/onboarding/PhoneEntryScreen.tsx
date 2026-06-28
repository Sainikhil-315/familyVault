import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { sendOtp } from '../../api/auth.api';
import { checkInvite } from '../../api/family.api';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'PhoneEntry'>;
};

export default function PhoneEntryScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  const isValid = /^\+[1-9]\d{7,14}$/.test(formattedPhone) && phone.replace(/\D/g, '').length >= 10;

  async function handleContinue() {
    if (!isValid) return;
    setLoading(true);
    try {
      // Check if this number is invited to a family (member path)
      const invite = await checkInvite(formattedPhone);

      if (invite.alreadyMember) {
        Alert.alert('Already a member', 'This number is already part of a family. Please sign in normally.');
        return;
      }

      if (invite.invited && invite.familyId && invite.familyName) {
        // Member path: skip OTP, go to family confirmation
        navigation.navigate('FamilyConfirm', {
          phone: formattedPhone,
          familyId: invite.familyId,
          familyName: invite.familyName,
        });
        return;
      }

      // Admin path: send OTP
      await sendOtp(formattedPhone);
      navigation.navigate('OTP', { phone: formattedPhone });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter your phone number</Text>
        <Text style={styles.subtitle}>Members are verified via family PIN — no OTP cost</Text>

        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>🇮🇳 +91</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="98765 43210"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            autoFocus
          />
        </View>

        <Text style={styles.hint}>Enter 10-digit mobile number</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prefix: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  prefixText: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
    letterSpacing: 1,
  },
  hint: { marginTop: spacing.sm, fontSize: fontSize.sm, color: colors.textSecondary },
  footer: { padding: spacing.xl },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },
});
