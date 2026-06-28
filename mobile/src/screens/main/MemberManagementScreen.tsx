import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { getMembers, toggleMemberUpload, MemberInfo } from '../../api/family.api';
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
} from '../../components/ui';
import { colors, spacing } from '../../theme';

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
      <Card padded={false} style={styles.memberCard}>
        <ListRow
          title={`${item.name}${isMe ? ' (you)' : ''}`}
          subtitle={item.phone}
          leading={<Avatar name={item.name} size={44} />}
          trailing={
            isAdmin ? (
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
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No members yet"
              message="Invite family members to share your vault."
            />
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
});
