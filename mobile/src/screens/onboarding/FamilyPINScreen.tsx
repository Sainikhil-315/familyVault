import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { signInWithCustomToken } from 'firebase/auth';
import { OnboardingStackParamList } from '../../types/navigation';
import { verifyPin } from '../../api/family.api';
import { submitJoinRequest } from '../../api/family.api';
import { firebaseAuth } from '../../config/firebase';
import { Screen, AppHeader, Text, Button, Input } from '../../components/ui';
import { spacing } from '../../theme';

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
    <Screen
      header={<AppHeader title="Join Family" onBack={() => navigation.goBack()} />}
      keyboardAvoiding
      footer={
        <View style={styles.footer}>
          <Button
            title="Request to Join"
            onPress={handleSubmit}
            disabled={!isValid}
            loading={loading}
          />
        </View>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">Join {familyName}</Text>
        <Text variant="body" muted>
          Enter your name and the family PIN shared by the admin
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Your Name"
          placeholder="e.g. Ravi Sharma"
          value={name}
          onChangeText={setName}
          maxLength={40}
          autoFocus
        />

        <Input
          label="Family PIN"
          placeholder="Enter 4–6 digit PIN"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          value={pin}
          onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
          hint="Ask the family admin for this PIN"
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
