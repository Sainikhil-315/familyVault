import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import { AppStackParamList } from '../../types/navigation';
import { firebaseAuth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, radius } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Profile'>;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, role, canUpload, memberName } = useAuth();

  const phone = user?.phoneNumber ?? '—';
  const displayName = memberName ?? phone;
  const roleLabel = role === 'admin' ? 'Admin' : 'Member';
  const uploadLabel = role === 'admin' ? 'Yes (admin)' : canUpload ? 'Yes' : 'No';

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(firebaseAuth),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <InfoRow label="Phone" value={phone} />
          <View style={styles.divider} />
          <InfoRow label="Role" value={roleLabel} />
          <View style={styles.divider} />
          <InfoRow label="Can Upload" value={uploadLabel} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '500' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  content: { padding: spacing.xl, gap: spacing.lg },
  avatarSection: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.primary },
  displayName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  roleBadge: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  roleBadgeText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardTitle: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  infoLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  signOutBtn: {
    backgroundColor: '#FEF2F2', borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  signOutText: { color: colors.error, fontSize: fontSize.md, fontWeight: '600' },
});
