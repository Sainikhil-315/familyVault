import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../types/navigation';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'FamilyConfirm'>;
  route: RouteProp<OnboardingStackParamList, 'FamilyConfirm'>;
};

export default function FamilyConfirmScreen({ navigation, route }: Props) {
  const { phone, familyId, familyName } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦</Text>
        <Text style={styles.title}>You've been invited!</Text>
        <Text style={styles.subtitle}>Your number has been added to a family vault</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Family Name</Text>
          <Text style={styles.cardValue}>{familyName}</Text>
        </View>

        <Text style={styles.question}>Is this your family?</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('FamilyPIN', { phone, familyId, familyName })}
        >
          <Text style={styles.buttonText}>Yes, this is my family</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>No, go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center' },
  card: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cardLabel: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', marginBottom: spacing.xs },
  cardValue: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  question: { fontSize: fontSize.md, color: colors.textSecondary },
  footer: { padding: spacing.xl, gap: spacing.sm },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },
  secondaryButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '500' },
});
