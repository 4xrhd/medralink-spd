import { query, queryOne, execute } from '../db/database.js';
import { Notification, NotificationSettings, NotificationType, NotificationCategory } from '../types/index.js';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  link?: string;
}

export async function getUserSettings(userId: string): Promise<NotificationSettings> {
  const existing = await queryOne<NotificationSettings>(
    'SELECT * FROM notification_settings WHERE user_id = ?',
    [userId]
  );

  if (existing) {
    return existing;
  }

  // Initialize default notification preferences
  const defaultSettings: NotificationSettings = {
    user_id: userId,
    critical_alerts: 1,
    prescription_updates: 1,
    lab_results: 1,
    security_audits: 1,
    sound_enabled: 1,
    email_digest: 0
  };

  await execute(
    `INSERT INTO notification_settings 
      (user_id, critical_alerts, prescription_updates, lab_results, security_audits, sound_enabled, email_digest)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      defaultSettings.user_id,
      defaultSettings.critical_alerts,
      defaultSettings.prescription_updates,
      defaultSettings.lab_results,
      defaultSettings.security_audits,
      defaultSettings.sound_enabled,
      defaultSettings.email_digest
    ]
  );

  return defaultSettings;
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<{
    criticalAlerts: boolean | number;
    prescriptionUpdates: boolean | number;
    labResults: boolean | number;
    securityAudits: boolean | number;
    soundEnabled: boolean | number;
    emailDigest: boolean | number;
  }>
): Promise<NotificationSettings> {
  const current = await getUserSettings(userId);

  const toInt = (val: any, fallback: number) => {
    if (val === undefined || val === null) return fallback;
    return val === true || val === 1 || val === '1' ? 1 : 0;
  };

  const newSettings = {
    critical_alerts: toInt(updates.criticalAlerts, current.critical_alerts),
    prescription_updates: toInt(updates.prescriptionUpdates, current.prescription_updates),
    lab_results: toInt(updates.labResults, current.lab_results),
    security_audits: toInt(updates.securityAudits, current.security_audits),
    sound_enabled: toInt(updates.soundEnabled, current.sound_enabled),
    email_digest: toInt(updates.emailDigest, current.email_digest)
  };

  await execute(
    `UPDATE notification_settings
     SET critical_alerts = ?, prescription_updates = ?, lab_results = ?, security_audits = ?, sound_enabled = ?, email_digest = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [
      newSettings.critical_alerts,
      newSettings.prescription_updates,
      newSettings.lab_results,
      newSettings.security_audits,
      newSettings.sound_enabled,
      newSettings.email_digest,
      userId
    ]
  );

  return {
    ...current,
    ...newSettings
  };
}

export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  const { userId, title, message, type = 'INFO', category = 'GENERAL', link } = params;

  // Check notification settings channel toggle
  const settings = await getUserSettings(userId);
  if (category === 'CRITICAL_ALERT' && !settings.critical_alerts) {
    return null;
  }
  if (category === 'PRESCRIPTION' && !settings.prescription_updates) {
    return null;
  }
  if (category === 'LAB_RESULT' && !settings.lab_results) {
    return null;
  }
  if (category === 'SECURITY_AUDIT' && !settings.security_audits) {
    return null;
  }

  const id = 'notif-' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO notifications (id, user_id, title, message, type, category, link, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, userId, title, message, type, category, link || null, now]
  );

  return {
    id,
    user_id: userId,
    title,
    message,
    type,
    category,
    link,
    is_read: 0,
    created_at: now
  };
}

export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: any[] = [userId];

  if (unreadOnly) {
    sql += ' AND is_read = 0';
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  const notifications = await query<Notification>(sql, params);

  const unreadCountRow = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  return {
    notifications,
    unreadCount: unreadCountRow?.count || 0
  };
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<boolean> {
  const result = await execute(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return result.changes > 0;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await execute(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return result.changes;
}

export async function deleteNotification(userId: string, notificationId: string): Promise<boolean> {
  const result = await execute(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return result.changes > 0;
}

export async function clearAllNotifications(userId: string): Promise<number> {
  const result = await execute(
    'DELETE FROM notifications WHERE user_id = ?',
    [userId]
  );
  return result.changes;
}
