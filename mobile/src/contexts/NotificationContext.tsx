import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getNotifications } from '../api/family.api';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  pendingCount: number;
  refreshCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  pendingCount: 0,
  refreshCount: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { role, familyId } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (role !== 'admin' || !familyId) {
      setPendingCount(0);
      return;
    }
    try {
      const notifs = await getNotifications();
      setPendingCount(notifs.filter((n) => n.status === 'pending').length);
    } catch {
      // silently fail — badge count is non-critical
    }
  }, [role, familyId]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return (
    <NotificationContext.Provider value={{ pendingCount, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function usePendingCount() {
  return useContext(NotificationContext);
}
