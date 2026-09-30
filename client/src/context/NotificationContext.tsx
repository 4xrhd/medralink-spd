import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.js';
import { useAuth } from './AuthContext.js';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
export type NotificationCategory = 'CRITICAL_ALERT' | 'PRESCRIPTION' | 'LAB_RESULT' | 'SECURITY_AUDIT' | 'GENERAL';

export interface NotificationItem {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  link?: string;
  is_read: number;
  created_at: string;
}

export interface NotificationSettings {
  user_id?: string;
  critical_alerts: number;
  prescription_updates: number;
  lab_results: number;
  security_audits: number;
  sound_enabled: number;
  email_digest: number;
  updated_at?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  settings: NotificationSettings;
  fetchNotifications: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<{
    criticalAlerts: boolean;
    prescriptionUpdates: boolean;
    labResults: boolean;
    securityAudits: boolean;
    soundEnabled: boolean;
    emailDigest: boolean;
  }>) => Promise<void>;
}

const defaultSettings: NotificationSettings = {
  critical_alerts: 1,
  prescription_updates: 1,
  lab_results: 1,
  security_audits: 1,
  sound_enabled: 1,
  email_digest: 0
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications');
      if (res.data?.success && res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user]);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      return;
    }
    try {
      const res = await api.get('/notifications/settings');
      if (res.data?.success && res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err);
    }
  }, [user]);

  // Initial fetch and 30-second polling interval
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchNotifications(), fetchSettings()]).finally(() => setLoading(false));

      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setSettings(defaultSettings);
    }
  }, [user, fetchNotifications, fetchSettings]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: 1 } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert if error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
    setUnreadCount(0);

    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    // Optimistic update
    const target = notifications.find((n) => n.id === id);
    const wasUnread = target ? !target.is_read : false;

    setNotifications((prev) => prev.filter((item) => item.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  const updateSettings = useCallback(async (updates: Partial<{
    criticalAlerts: boolean;
    prescriptionUpdates: boolean;
    labResults: boolean;
    securityAudits: boolean;
    soundEnabled: boolean;
    emailDigest: boolean;
  }>) => {
    try {
      const res = await api.put('/notifications/settings', updates);
      if (res.data?.success && res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      settings,
      fetchNotifications,
      fetchSettings,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      updateSettings
    }),
    [
      notifications,
      unreadCount,
      loading,
      settings,
      fetchNotifications,
      fetchSettings,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      updateSettings
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default useNotifications;
