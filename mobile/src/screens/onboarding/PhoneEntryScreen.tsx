import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { sendOtp } from '../../api/auth.api';
import { checkInvite } from '../../api/family.api';
import { Screen, AppHeader, Text, Button, Input } from '../../components/ui';
import { spacing } from '../../theme';

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
    <Screen
      scroll={false}
      keyboardAvoiding
      header={<AppHeader onBack={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            loading={loading}
            disabled={!isValid}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h1">Enter your phone number</Text>
          <Text variant="body" muted>
            Members are verified via family PIN — no OTP cost
          </Text>
        </View>

        <Input
          label="Mobile number (🇮🇳 +91)"
          placeholder="98765 43210"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
          autoFocus
          hint="Enter 10-digit mobile number"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: spacing.xl, gap: spacing.xl },
  intro: { gap: spacing.sm },
  footer: { padding: spacing.lg },
});
