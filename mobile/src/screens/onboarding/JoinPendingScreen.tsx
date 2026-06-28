import React from 'react';
import { View, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../config/firebase';
import { Screen, Text, Button, Card, IconChip } from '../../components/ui';
import { colors, spacing, radius } from '../../theme';

export default function JoinPendingScreen() {
  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Text variant="caption" center>
            Close the app and reopen after admin approves.
          </Text>
          <Button title="Cancel Request" variant="ghost" onPress={() => signOut(firebaseAuth)} />
        </View>
      }
    >
      <View style={styles.content}>
        <IconChip icon="hourglass-outline" size={72} />
        <View style={styles.intro}>
          <Text variant="h1" center>
            Request Sent!
          </Text>
          <Text variant="body" muted center>
            Your join request has been sent to the family admin. You&apos;ll get access once they
            approve you.
          </Text>
        </View>

        <Card style={styles.steps}>
          <StepRow number="1" text="Admin receives your request" done />
          <StepRow number="2" text="Admin taps Approve" done={false} />
          <StepRow number="3" text="You get full vault access" done={false} />
        </Card>
      </View>
    </Screen>
  );
}

function StepRow({ number, text, done }: { number: string; text: string; done: boolean }) {
  return (
    <View style={stepStyles.row}>
      <View style={[stepStyles.badge, done && stepStyles.badgeDone]}>
        <Text variant="caption" color={done ? colors.white : colors.textSecondary}>
          {done ? '✓' : number}
        </Text>
      </View>
      <Text variant={done ? 'bodyMedium' : 'body'} color={done ? colors.text : colors.textSecondary} style={stepStyles.text}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  intro: { gap: spacing.sm, alignItems: 'center' },
  steps: { width: '100%', gap: spacing.md },
  footer: { padding: spacing.lg, gap: spacing.sm, alignItems: 'center' },
});

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { flex: 1 },
});
