import { Request, Response } from 'express';
import { execute, query, queryOne } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';

interface SettingDefinition {
  defaultValue: string;
  description: string;
  numeric: boolean;
}

/** Only these keys can be configured; values are validated against their definition. */
export const SETTING_DEFINITIONS: Record<string, SettingDefinition> = {
  clinic_name: { defaultValue: 'MedraLink Health Network', description: 'Name printed on PDF documents', numeric: false },
  max_upload_mb: { defaultValue: '10', description: 'Maximum lab report upload size (MB)', numeric: true },
  session_ttl_hours: { defaultValue: '24', description: 'Login session lifetime (hours)', numeric: true },
  require_doctor_verification: { defaultValue: 'true', description: 'Doctors need admin verification', numeric: false },
};

function audit(req: Request, action: string, targetResource: string, targetId: string, details: string) {
  return recordAuditEvent({
    actorId: req.user?.id,
    actorRole: req.user?.role || 'ADMIN',
    action,
    targetResource,
    targetId,
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'],
    details,
  });
}

export async function listUsers(req: Request, res: Response) {
  try {
    const { role, status, q } = req.query as Record<string, string | undefined>;
    let sql = 'SELECT id, email, role, full_name, phone, status, created_at FROM users WHERE 1=1';
    const params: unknown[] = [];
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (q) {
      sql += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    return res.json({ success: true, data: await query(sql, params) });
  } catch (error: any) {
    console.error('List users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list users.' });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }
    if (id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'You cannot change the status of your own account.' });
    }
    const target = await queryOne<{ email: string }>('SELECT email FROM users WHERE id = ?', [id]);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await execute('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    await audit(req, 'USER_STATUS_CHANGED', 'users', id, `${target.email} set to ${status}`);
    return res.json({ success: true, message: `User status set to ${status}.` });
  } catch (error: any) {
    console.error('Update user status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

export async function getSettings(_req: Request, res: Response) {
  try {
    const stored = await query<{ key: string; value: string; updated_at: string }>('SELECT key, value, updated_at FROM system_settings');
    const byKey = new Map(stored.map((s) => [s.key, s]));
    const data = Object.entries(SETTING_DEFINITIONS).map(([key, def]) => ({
      key,
      value: byKey.get(key)?.value ?? def.defaultValue,
      description: def.description,
      numeric: def.numeric,
      updatedAt: byKey.get(key)?.updated_at ?? null,
    }));
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load settings.' });
  }
}

function findInvalidSetting(settings: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(settings)) {
    const def = SETTING_DEFINITIONS[key];
    if (!def) return `Unknown setting "${key}".`;
    if (typeof value !== 'string' || value.length > 200) return `Invalid value for "${key}".`;
    if (def.numeric && !/^\d{1,4}$/.test(value)) return `"${key}" must be a whole number.`;
  }
  return null;
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const settings = req.body?.settings;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'Body must be { settings: { key: value } }.' });
    }
    const invalid = findInvalidSetting(settings);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    for (const [key, value] of Object.entries(settings as Record<string, string>)) {
      await execute('DELETE FROM system_settings WHERE key = ?', [key]);
      await execute(
        'INSERT INTO system_settings (key, value, description, updated_by) VALUES (?, ?, ?, ?)',
        [key, value, SETTING_DEFINITIONS[key].description, req.user?.id ?? null]
      );
    }
    await audit(req, 'SETTINGS_UPDATED', 'system_settings', 'system', JSON.stringify(settings));
    return res.json({ success: true, message: 'Settings saved.' });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save settings.' });
  }
}
