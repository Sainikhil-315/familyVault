import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { Screen, Text, Button, IconChip } from '../../components/ui';
import { colors, spacing, scaleFont } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IoniconName; text: string }[] = [
  { icon: 'folder-open-outline', text: 'Store Aadhaar, PAN, land records & more' },
  { icon: 'people-outline', text: 'Share access with family members' },
  { icon: 'flash-outline', text: 'Access anytime, anywhere' },
];

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <Screen
      scroll={false}
      padded
      footer={
        <View style={styles.footer}>
          <Button title="Get Started" onPress={() => navigation.navigate('PhoneEntry')} />
          <Text variant="caption" center style={styles.disclaimer}>
            Admin registration requires phone verification
          </Text>
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Ionicons name="home" size={scaleFont(40)} color={colors.primary} />
          </View>
          <Text variant="display" center style={styles.logoText}>
            FamilyVault
          </Text>
          <Text variant="body" muted center>
            One vault. Every document. Your whole family.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <IconChip icon={f.icon} size={44} />
              <Text variant="bodyMedium" style={styles.featureText}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: spacing.xxl },
  brand: { alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: scaleFont(80),
    height: scaleFont(80),
    borderRadius: scaleFont(24),
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoText: { marginBottom: spacing.xs },
  features: { gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureText: { flex: 1 },
  footer: { padding: spacing.lg, gap: spacing.md },
  disclaimer: { color: colors.textTertiary },
});
