import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, radius } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  const { role, canUpload, memberName, user } = useAuth();
  const isAdmin = role === 'admin';
  const showUpload = isAdmin || canUpload;
  const greeting = memberName ?? user?.phoneNumber ?? 'there';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>FamilyVault</Text>
          <Text style={styles.greeting}>Hi, {greeting}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileInitial}>{greeting.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Documents */}
        <Text style={styles.sectionTitle}>Documents</Text>
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={() => navigation.navigate('DocumentsHome')}
        >
          <Text style={styles.primaryCardIcon}>ðŸ“</Text>
          <View style={styles.primaryCardText}>
            <Text style={styles.primaryCardTitle}>Family Vault</Text>
            <Text style={styles.primaryCardSub}>Identity Â· Property Â· Medical Â· and more</Text>
          </View>
          <Text style={styles.chevron}>â€º</Text>
        </TouchableOpacity>

        {showUpload && (
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={() => navigation.navigate('DocumentUpload')}
          >
            <Text style={styles.uploadCardIcon}>â¬†ï¸</Text>
            <Text style={styles.uploadCardText}>Upload Document</Text>
          </TouchableOpacity>
        )}

        {/* Admin section */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Admin</Text>
            <View style={styles.adminGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('InviteMember')}
              >
                <Text style={styles.actionIcon}>âž•</Text>
                <Text style={styles.actionLabel}>Invite Member</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Text style={styles.actionIcon}>ðŸ””</Text>
                <Text style={styles.actionLabel}>Join Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Members')}
              >
                <Text style={styles.actionIcon}>ðŸ‘¥</Text>
                <Text style={styles.actionLabel}>Members</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('FamilySettings')}
              >
                <Text style={styles.actionIcon}>âš™ï¸</Text>
                <Text style={styles.actionLabel}>Settings</Text>
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
  greeting: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  content: { padding: spacing.xl, gap: spacing.md },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  primaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  primaryCardIcon: { fontSize: 32 },
  primaryCardText: { flex: 1 },
  primaryCardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  primaryCardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textSecondary },
  uploadCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
  },
  uploadCardIcon: { fontSize: 20 },
  uploadCardText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  adminGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: {
    width: '47%', backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', gap: spacing.sm,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, textAlign: 'center' },
});
