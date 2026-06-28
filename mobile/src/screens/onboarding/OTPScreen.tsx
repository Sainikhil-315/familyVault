import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { signInWithCustomToken } from 'firebase/auth';
import { OnboardingStackParamList } from '../../types/navigation';
import { verifyOtp, sendOtp } from '../../api/auth.api';
import { firebaseAuth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Screen, AppHeader, Text, Button } from '../../components/ui';
import { colors, spacing, radius, scaleFont } from '../../theme';

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
    <Screen
      scroll={false}
      keyboardAvoiding
      header={<AppHeader onBack={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.length !== 6}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h1">Enter verification code</Text>
          <Text variant="body" muted>
            Sent to {phone}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.otpBox}
          onPress={() => inputRef.current?.focus()}
        >
          <View style={styles.otpDigits}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.digit, otp.length === i && styles.digitActive]}>
                <Text variant="h1" style={styles.digitText}>
                  {otp[i] ?? ''}
                </Text>
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
          <Text
            variant="bodyMedium"
            center
            color={resendCooldown > 0 ? colors.textTertiary : colors.primary}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: spacing.xl, gap: spacing.xl },
  intro: { gap: spacing.sm },
  otpBox: { alignItems: 'center' },
  otpDigits: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  digit: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  digitActive: { borderColor: colors.primary },
  digitText: { fontSize: scaleFont(22) },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0 },
  footer: { padding: spacing.lg },
});
