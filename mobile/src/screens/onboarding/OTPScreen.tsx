import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { signInWithCustomToken } from 'firebase/auth';
import { OnboardingStackParamList } from '../../types/navigation';
import { verifyOtp, sendOtp } from '../../api/auth.api';
import { firebaseAuth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OTP'>;
  route: RouteProp<OnboardingStackParamList, 'OTP'>;
};

export default function OTPScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const { setFamilyId } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<TextInput>(null);

  async function handleVerify() {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const customToken = await verifyOtp(phone, otp);
      const { user } = await signInWithCustomToken(firebaseAuth, customToken);

      // Check if user already has a family
      const { getDoc, doc } = await import('firebase/firestore');
      const { firestore } = await import('../../config/firebase');
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const familyIds: string[] = userDoc.data()?.familyIds ?? [];

      if (familyIds.length > 0) {
        setFamilyId(familyIds[0]);
        // Navigator switches to AppStack automatically via auth state
      } else {
        navigation.navigate('FamilyCreate');
      }
    } catch (err) {
      Alert.alert('Verification Failed', err instanceof Error ? err.message : 'Invalid OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      await sendOtp(phone);
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not resend OTP');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter verification code</Text>
        <Text style={styles.subtitle}>Sent to {phone}</Text>

        <TouchableOpacity style={styles.otpBox} onPress={() => inputRef.current?.focus()}>
          <View style={styles.otpDigits}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.digit, otp.length === i && styles.digitActive]}>
                <Text style={styles.digitText}>{otp[i] ?? ''}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(v) => {
            setOtp(v.replace(/\D/g, ''));
          }}
          autoFocus
        />

        <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0}>
          <Text style={[styles.resend, resendCooldown > 0 && styles.resendDisabled]}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, otp.length !== 6 && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={otp.length !== 6 || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
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
  otpBox: { marginBottom: spacing.md },
  otpDigits: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  digit: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  digitActive: { borderColor: colors.primary },
  digitText: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0 },
  resend: { textAlign: 'center', color: colors.primary, fontSize: fontSize.md, fontWeight: '500' },
  resendDisabled: { color: colors.textSecondary },
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
