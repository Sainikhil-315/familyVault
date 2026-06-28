import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🏠</Text>
          <Text style={styles.logoText}>FamilyVault</Text>
          <Text style={styles.tagline}>One vault. Every document. Your whole family.</Text>
        </View>

        <View style={styles.features}>
          {['Store Aadhaar, PAN, land records & more', 'Share access with family members', 'Encrypted — only your family can read'].map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureDot}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PhoneEntry')}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Admin registration requires phone verification</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  logoIcon: { fontSize: 64, marginBottom: spacing.md },
  logoText: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  tagline: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  features: { gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  featureDot: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  featureText: { color: colors.text, fontSize: fontSize.md, flex: 1 },
  footer: { padding: spacing.xl, gap: spacing.sm },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '600' },
  disclaimer: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center' },
});
