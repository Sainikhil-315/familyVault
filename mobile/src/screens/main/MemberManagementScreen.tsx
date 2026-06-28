import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { getMembers, toggleMemberUpload, MemberInfo } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, radius } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Members'>;
};

export default function MemberManagementScreen({ navigation }: Props) {
  const { familyId, user } = useAuth();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMembers(familyId);
      setMembers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(member: MemberInfo) {
    if (!familyId) return;
    const next = !member.canUpload;
    setTogglingId(member.id);
    try {
      await toggleMemberUpload(familyId, member.id, next);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, canUpload: next } : m))
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update permission');
    } finally {
      setTogglingId(null);
    }
  }

  function renderMember({ item }: { item: MemberInfo }) {
    const isMe = item.id === user?.uid;
    const isAdmin = item.role === 'admin';
    const toggling = togglingId === item.id;

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberAvatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.name}{isMe ? ' (you)' : ''}</Text>
            {isAdmin && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>}
          </View>
          <Text style={styles.memberPhone}>{item.phone}</Text>
        </View>
        {!isAdmin && (
          <View style={styles.uploadToggle}>
            <Text style={styles.uploadLabel}>Upload</Text>
            {toggling ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={item.canUpload}
                onValueChange={() => handleToggle(item)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.backBtn} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {error && !loading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.hint}>Toggle Upload to let members add documents.</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  errorText: { color: colors.error, fontSize: fontSize.md, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm, borderRadius: radius.md,
  },
  retryBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.md },
  list: { padding: spacing.lg, gap: spacing.sm },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  adminBadge: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  adminBadgeText: { fontSize: fontSize.sm - 1, fontWeight: '600', color: colors.primary },
  memberPhone: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  uploadToggle: { alignItems: 'center', gap: 4 },
  uploadLabel: { fontSize: fontSize.sm - 1, color: colors.textSecondary },
  separator: { height: spacing.sm },
});
