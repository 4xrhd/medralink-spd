import { Request, Response } from 'express';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getUserSettings,
  updateUserSettings
} from '../services/notificationService.js';

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const unreadOnly = req.query.unreadOnly === 'true';
    const data = await getUserNotifications(userId, unreadOnly);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Notification ID required' });
    }

    const updated = await markNotificationRead(userId, id);
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: { updated }
    });
  } catch (error: any) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const count = await markAllNotificationsRead(userId);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: { count }
    });
  } catch (error: any) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
}

export async function deleteSingleNotification(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Notification ID required' });
    }

    const deleted = await deleteNotification(userId, id);
    return res.status(200).json({
      success: true,
      message: 'Notification deleted.',
      data: { deleted }
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
}

export async function clearAll(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const count = await clearAllNotifications(userId);
    return res.status(200).json({
      success: true,
      message: 'All notifications cleared.',
      data: { count }
    });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear notifications.' });
  }
}

export async function getSettings(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const settings = await getUserSettings(userId);
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error('Error fetching notification settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notification settings.' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const settings = await updateUserSettings(userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully.',
      data: settings
    });
  } catch (error: any) {
    console.error('Error updating notification settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification settings.' });
  }
}
