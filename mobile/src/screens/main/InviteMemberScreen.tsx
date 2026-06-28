import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { inviteMember } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Screen,
  AppHeader,
  Text,
  Card,
  Input,
  Button,
} from '../../components/ui';
import { spacing } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'InviteMember'>;
};

export default function InviteMemberScreen({ navigation }: Props) {
  const { familyId } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  const isValid = /^\+[1-9]\d{7,14}$/.test(formattedPhone) && phone.replace(/\D/g, '').length >= 10;

  async function handleInvite() {
    if (!isValid || !familyId) return;
    setLoading(true);
    try {
      await inviteMember(familyId, formattedPhone);
      Alert.alert(
        'Invitation Created',
        `${formattedPhone} can now join your family vault.\n\nShare the app link and your Family PIN with them privately.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create invitation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      keyboardAvoiding
      header={<AppHeader title="Invite Member" onBack={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Add Invitation"
            onPress={handleInvite}
            disabled={!isValid || loading}
            loading={loading}
          />
        </View>
      }
      contentContainerStyle={styles.content}
    >
      <Text variant="body" muted style={styles.description}>
        Enter the phone number of the person you want to invite. Then share the app and your Family
        PIN with them privately.
      </Text>

      <Input
        label="Phone Number"
        placeholder="98765 43210"
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
        autoFocus
        hint="🇮🇳 +91 will be added automatically"
      />

      <Card style={styles.infoBox}>
        <Text variant="bodyMedium" style={styles.infoTitle}>📋 How to complete the invite</Text>
        <Text variant="caption">1. Tap "Add Invitation" below</Text>
        <Text variant="caption">2. Share app download link with them (WhatsApp/SMS)</Text>
        <Text variant="caption">3. Tell them the Family PIN verbally or in person</Text>
        <Text variant="caption">4. Approve their join request from Notifications</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  description: { lineHeight: 22 },
  infoBox: { gap: spacing.xs },
  infoTitle: { marginBottom: spacing.xs },
  footer: { padding: spacing.lg },
});
