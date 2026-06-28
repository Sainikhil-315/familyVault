import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import { AppStackParamList } from '../../types/navigation';
import { firebaseAuth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  const { role, canUpload } = useAuth();
  const isAdmin = role === 'admin';
  const showUpload = isAdmin || canUpload;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🏠 FamilyVault</Text>
        <TouchableOpacity onPress={() => signOut(firebaseAuth)}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Documents */}
        <Text style={styles.sectionTitle}>Documents</Text>
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={() => navigation.navigate('DocumentsHome')}
        >
          <Text style={styles.primaryCardIcon}>📁</Text>
          <View style={styles.primaryCardText}>
            <Text style={styles.primaryCardTitle}>Family Vault</Text>
            <Text style={styles.primaryCardSub}>Identity · Property · Medical · and more</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {showUpload && (
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={() => navigation.navigate('DocumentUpload')}
          >
            <Text style={styles.uploadCardIcon}>⬆️</Text>
            <Text style={styles.uploadCardText}>Upload Document</Text>
          </TouchableOpacity>
        )}

        {/* Admin section */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Admin</Text>
            <View style={styles.adminActions}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('InviteMember')}
              >
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionLabel}>Invite Member</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Text style={styles.actionIcon}>🔔</Text>
                <Text style={styles.actionLabel}>Join Requests</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  logo: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  signOutText: { color: colors.textSecondary, fontSize: fontSize.sm },
  content: { padding: spacing.xl, gap: spacing.md },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  primaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  primaryCardIcon: { fontSize: 32 },
  primaryCardText: { flex: 1 },
  primaryCardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  primaryCardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textSecondary },
  uploadCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: 12, padding: spacing.md,
  },
  uploadCardIcon: { fontSize: 20 },
  uploadCardText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  adminActions: { flexDirection: 'row', gap: spacing.md },
  actionCard: {
    flex: 1, backgroundColor: colors.primaryLight, borderRadius: 16,
    padding: spacing.lg, alignItems: 'center', gap: spacing.sm,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, textAlign: 'center' },
});
