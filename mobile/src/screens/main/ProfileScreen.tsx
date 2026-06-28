import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseAuth } from '../../config/firebase';
import { Text, Avatar, Icon, Divider } from '../../components/ui';
import { colors, spacing, radius, shadows } from '../../theme';
import { TAB_SCROLL_PADDING } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface RowProps {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={styles.row}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Icon name={icon} size={20} color={danger ? colors.error : colors.primary} />
      </View>
      <Text variant="bodyMedium" style={[styles.rowLabel, danger && { color: colors.error }]}>
        {label}
      </Text>
      {value ? (
        <Text variant="caption" style={styles.rowValue}>{value}</Text>
      ) : null}
      {onPress && !danger ? (
        <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { memberName, role, canUpload, user } = useAuth();
  const isAdmin = role === 'admin';

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(firebaseAuth);
          } catch {
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Avatar name={memberName} size={80} />
          <Text variant="h1" style={styles.name}>{memberName ?? user?.phoneNumber ?? 'My Account'}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingsRow icon="call-outline" label="Phone" value={user?.phoneNumber ?? '—'} />
            <Divider style={styles.divider} />
            <SettingsRow icon="shield-checkmark-outline" label="Role" value={isAdmin ? 'Admin' : 'Member'} />
            <Divider style={styles.divider} />
            <SettingsRow icon="cloud-upload-outline" label="Can Upload" value={canUpload ? 'Yes' : 'No'} />
          </View>
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text variant="label" style={styles.sectionTitle}>Family</Text>
            <View style={styles.card}>
              <SettingsRow icon="person-add-outline" label="Invite Member" onPress={() => navigation.navigate('InviteMember')} />
              <Divider style={styles.divider} />
              <SettingsRow icon="people-outline" label="Members" onPress={() => navigation.navigate('Members')} />
              <Divider style={styles.divider} />
              <SettingsRow icon="notifications-outline" label="Join Requests" onPress={() => navigation.navigate('Notifications')} />
              <Divider style={styles.divider} />
              <SettingsRow icon="settings-outline" label="Family Settings" onPress={() => navigation.navigate('FamilySettings')} />
            </View>
          </View>
        )}

        <View style={[styles.section, styles.signOutSection]}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Icon name="log-out-outline" size={20} color={colors.error} />
            <Text variant="bodyMedium" color={colors.error}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  name: { marginTop: spacing.xs },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconDanger: { backgroundColor: colors.errorLight },
  rowLabel: { flex: 1 },
  rowValue: { color: colors.textSecondary },
  divider: { marginVertical: 0, marginHorizontal: spacing.md },
  scrollContent: { paddingBottom: TAB_SCROLL_PADDING },
  signOutSection: { marginTop: spacing.sm },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FECACA',
  },
});
