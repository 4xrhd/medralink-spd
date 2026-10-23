import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execute, queryOne } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

function auditFromRequest(req: Request, actorId: string, actorRole: string, action: string, details: string) {
  return recordAuditEvent({
    actorId,
    actorRole,
    action,
    targetResource: 'users',
    targetId: actorId,
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'],
    details,
  });
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const user = req.user!;
    const { fullName, phone } = req.body;
    if (fullName === undefined && phone === undefined) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    await execute(
      `UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [fullName ?? null, phone ?? null, user.id]
    );
    await auditFromRequest(req, user.id, user.role, 'PROFILE_UPDATED', 'User updated own profile');
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;
    const row = await queryOne<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', [user.id]);
    if (!row || !(await bcrypt.compare(currentPassword, row.password_hash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await execute('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, user.id]);
    await auditFromRequest(req, user.id, user.role, 'PASSWORD_CHANGED', 'User changed own password');
    return res.json({ success: true, message: 'Password changed.' });
  } catch (error: any) {
    console.error('Password change error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
}

/**
 * Issues a single-use reset token. Email delivery is simulated for the academic MVP:
 * the user gets an in-app notification and, outside production, the token is returned
 * so the demo flow can be completed. The response is identical for unknown emails.
 */
export async function forgotPassword(req: Request, res: Response) {
  const genericReply = { success: true, message: 'If the account exists, reset instructions have been sent.' };
  try {
    const user = await queryOne<{ id: string; role: string }>('SELECT id, role FROM users WHERE email = ?', [req.body.email]);
    if (!user) {
      return res.json(genericReply);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await execute('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
    await execute(
      'INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      ['pwr-' + crypto.randomBytes(6).toString('hex'), user.id, sha256(token), expiresAt]
    );
    await createNotification({
      userId: user.id,
      title: 'Password reset requested',
      message: 'A password reset was requested for your account. If this was not you, contact the administrator.',
      type: 'WARNING',
      category: 'SECURITY_AUDIT',
    });
    await auditFromRequest(req, user.id, user.role, 'PASSWORD_RESET_REQUESTED', 'Reset token issued');

    const exposeToken = process.env.NODE_ENV !== 'production';
    return res.json(exposeToken ? { ...genericReply, data: { resetToken: token } } : genericReply);
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    const reset = await queryOne<{ id: string; user_id: string; expires_at: string }>(
      'SELECT id, user_id, expires_at FROM password_resets WHERE token_hash = ?',
      [sha256(token)]
    );
    if (!reset || new Date(reset.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await execute('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, reset.user_id]);
    await execute('DELETE FROM password_resets WHERE id = ?', [reset.id]);
    const user = await queryOne<{ role: string }>('SELECT role FROM users WHERE id = ?', [reset.user_id]);
    await auditFromRequest(req, reset.user_id, user?.role || 'UNKNOWN', 'PASSWORD_RESET', 'Password reset with token');
    return res.json({ success: true, message: 'Password has been reset. You can now sign in.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
}
