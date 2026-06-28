import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../types/navigation';
import { Screen, AppHeader, Text, Button, Card, IconChip } from '../../components/ui';
import { spacing } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'FamilyConfirm'>;
  route: RouteProp<OnboardingStackParamList, 'FamilyConfirm'>;
};

export default function FamilyConfirmScreen({ navigation, route }: Props) {
  const { phone, familyId, familyName } = route.params;

  return (
    <Screen
      header={<AppHeader title="Family Invite" />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Yes, this is my family"
            onPress={() => navigation.navigate('FamilyPIN', { phone, familyId, familyName })}
          />
          <Button title="No, go back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      }
    >
      <View style={styles.content}>
        <IconChip icon="people-outline" size={72} />
        <View style={styles.intro}>
          <Text variant="h1" center>
            You&apos;ve been invited!
          </Text>
          <Text variant="body" muted center>
            Your number has been added to a family vault
          </Text>
        </View>

        <Card style={styles.card}>
          <Text variant="label">Family Name</Text>
          <Text variant="h2">{familyName}</Text>
        </Card>

        <Text variant="body" muted center>
          Is this your family?
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  intro: { gap: spacing.sm, alignItems: 'center' },
  card: { width: '100%', alignItems: 'center', gap: spacing.xs },
  footer: { padding: spacing.lg, gap: spacing.sm },
});
