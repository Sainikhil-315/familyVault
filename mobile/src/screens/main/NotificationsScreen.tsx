import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { getNotifications, approveJoin, Notification } from '../../api/family.api';
import { colors, spacing, fontSize } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Notifications'>;
};

export default function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.fromName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.fromName}</Text>
            <Text style={styles.cardPhone}>{item.fromPhone}</Text>
            <Text style={styles.cardDate}>{date}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.rejectBtn, isActioning && styles.btnDisabled]}
            onPress={() => handleAction(item.id, 'reject')}
            disabled={isActioning}
          >
            {isActioning ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Text style={styles.rejectText}>Reject</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approveBtn, isActioning && styles.btnDisabled]}
            onPress={() => handleAction(item.id, 'approve')}
            disabled={isActioning}
          >
            {isActioning ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.approveText}>Approve</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>â† Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Requests</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>âœ…</Text>
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '500', width: 60 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  cardPhone: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cardDate: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  rejectBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.error,
  },
  approveBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 10,
    alignItems: 'center', backgroundColor: colors.primary,
  },
  btnDisabled: { opacity: 0.5 },
  rejectText: { color: colors.error, fontWeight: '600', fontSize: fontSize.md },
  approveText: { color: colors.white, fontWeight: '600', fontSize: fontSize.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary },
});
