import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { getNotifications, approveJoin, Notification } from '../../api/family.api';
import { usePendingCount } from '../../contexts/NotificationContext';
import {
  Screen,
  AppHeader,
  Text,
  Card,
  Avatar,
  Button,
  EmptyState,
  LoadingView,
} from '../../components/ui';
import { spacing } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Notifications'>;
};

export default function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { refreshCount } = usePendingCount();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleAction(notificationId: string, action: 'approve' | 'reject') {
    setActionLoading(notificationId);
    try {
      await approveJoin(notificationId, action);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      refreshCount();
      Alert.alert(
        action === 'approve' ? 'Member Approved' : 'Request Rejected',
        action === 'approve'
          ? 'They now have access to the family vault.' : 'The request has been rejected.'
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  function renderItem({ item }: { item: Notification }) {
    const isActioning = actionLoading === item.id;
    const date = new Date(item.createdAt).toLocaleDateString('en-IN');

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Avatar name={item.fromName} size={48} />
          <View style={styles.cardInfo}>
            <Text variant="title">{item.fromName}</Text>
            <Text variant="caption">{item.fromPhone}</Text>
            <Text variant="caption">{date}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Reject"
            variant="danger"
            size="md"
            onPress={() => handleAction(item.id, 'reject')}
            disabled={isActioning}
            loading={isActioning}
            style={styles.actionBtn}
          />
          <Button
            title="Approve"
            variant="primary"
            size="md"
            onPress={() => handleAction(item.id, 'approve')}
            disabled={isActioning}
            loading={isActioning}
            style={styles.actionBtn}
          />
        </View>
      </Card>
    );
  }

  return (
    <Screen
      scroll={false}
      padded={false}
      header={<AppHeader title="Join Requests" onBack={() => navigation.goBack()} />}
    >
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-circle-outline"
              title="No pending requests"
              message="Join requests from family members will appear here."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  card: { gap: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardInfo: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1 },
});
