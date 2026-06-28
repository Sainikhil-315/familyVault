import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../config/firebase';
import { colors, spacing, fontSize } from '../../theme';

export default function JoinPendingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>â³</Text>
        <Text style={styles.title}>Request Sent!</Text>
        <Text style={styles.subtitle}>
          Your join request has been sent to the family admin. You'll get access once they approve you.
        </Text>

        <View style={styles.steps}>
          <StepRow number="1" text="Admin receives your request" done />
          <StepRow number="2" text="Admin taps Approve" done={false} />
          <StepRow number="3" text="You get full vault access" done={false} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>Close the app and reopen after admin approves.</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut(firebaseAuth)}>
          <Text style={styles.signOutText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StepRow({ number, text, done }: { number: string; text: string; done: boolean }) {
  return (
    <View style={stepStyles.row}>
      <View style={[stepStyles.badge, done && stepStyles.badgeDone]}>
        <Text style={[stepStyles.badgeText, done && stepStyles.badgeTextDone]}>
          {done ? 'âœ“' : number}
        </Text>
      </View>
      <Text style={[stepStyles.text, done && stepStyles.textDone]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  steps: { width: '100%', gap: spacing.md },
  footer: { padding: spacing.xl, gap: spacing.sm, alignItems: 'center' },
  footerNote: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  signOutBtn: { paddingVertical: spacing.sm },
  signOutText: { color: colors.error, fontSize: fontSize.sm, fontWeight: '500' },
});

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  badgeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  badgeTextDone: { color: colors.white },
  text: { fontSize: fontSize.md, color: colors.textSecondary, flex: 1 },
  textDone: { color: colors.text, fontWeight: '500' },
});
