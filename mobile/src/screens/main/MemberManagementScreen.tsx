import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { getMembers, toggleMemberUpload, getInvitedMembers, MemberInfo, InvitedMember } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Screen,
  AppHeader,
  Text,
  Card,
  Avatar,
  Badge,
  ListRow,
  EmptyState,
  LoadingView,
  ErrorView,
  SectionLabel,
  Icon,
} from '../../components/ui';
import { colors, spacing, radius } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Members'>;
};

export default function MemberManagementScreen({ navigation }: Props) {
  const { familyId, user, role } = useAuth();
  const isAdmin = role === 'admin';
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [invited, setInvited] = useState<InvitedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    setError(null);
    try {
      const [membersData, invitedData] = await Promise.all([
        getMembers(familyId),
        isAdmin ? getInvitedMembers(familyId) : Promise.resolve([]),
      ]);
      setMembers(membersData);
      setInvited(invitedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [familyId, isAdmin]);

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
    const memberIsAdmin = item.role === 'admin';
    const toggling = togglingId === item.id;

    return (
      <Card padded={false} style={styles.memberCard}>
        <ListRow
          title={`${item.name}${isMe ? ' (you)' : ''}`}
          subtitle={item.phone}
          leading={<Avatar name={item.name} size={44} />}
          trailing={
            memberIsAdmin ? (
              <Badge label="Admin" tone="primary" />
            ) : (
              <View style={styles.uploadToggle}>
                <Text variant="caption">Upload</Text>
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
            )
          }
        />
      </Card>
    );
  }

  function renderInvited({ item }: { item: InvitedMember }) {
    return (
      <Card padded={false} style={styles.memberCard}>
        <ListRow
          title={item.phone}
          subtitle={`Invited ${new Date(item.addedAt).toLocaleDateString('en-IN')}`}
          leading={<Avatar name={item.phone} size={44} />}
          trailing={
            <View style={styles.awaitingBadge}>
              <Icon name="time-outline" size={12} color={colors.warning} />
              <Text style={styles.awaitingText}>Awaiting</Text>
            </View>
          }
        />
      </Card>
    );
  }

  return (
    <Screen
      scroll={false}
      padded={false}
      header={<AppHeader title="Members" onBack={() => navigation.goBack()} />}
    >
      {loading && <LoadingView />}

      {error && !loading && <ErrorView message={error} onRetry={load} />}

      {!loading && !error && (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text variant="caption" style={styles.hint}>
              Toggle Upload to let members add documents.
            </Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            invited.length > 0 ? (
              <View style={styles.invitedSection}>
                <SectionLabel>Pending Invitations</SectionLabel>
                {invited.map((item) => (
                  <View key={item.phone}>
                    {renderInvited({ item })}
                    <View style={styles.separator} />
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            invited.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No members yet"
                message="Invite family members to share your vault."
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  hint: { marginBottom: spacing.md },
  memberCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  uploadToggle: { alignItems: 'center', gap: spacing.xs },
  separator: { height: spacing.sm },
  invitedSection: { marginTop: spacing.lg },
  awaitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningLight ?? '#FFF7ED',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  awaitingText: { fontSize: 12, color: colors.warning ?? '#F59E0B', fontWeight: '500' },
});
