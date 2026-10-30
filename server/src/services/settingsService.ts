import { queryOne } from '../db/database.js';

interface SettingDefinition {
  defaultValue: string;
  description: string;
  numeric: boolean;
}

/** System settings an administrator can change, with the value used when none is stored. */
export const SETTING_DEFINITIONS: Record<string, SettingDefinition> = {
  clinic_name: { defaultValue: 'MedraLink Health Network', description: 'Name printed on PDF documents', numeric: false },
  max_upload_mb: { defaultValue: '10', description: 'Maximum lab report upload size (MB)', numeric: true },
  session_ttl_hours: { defaultValue: '24', description: 'Login session lifetime (hours)', numeric: true },
  require_doctor_verification: { defaultValue: 'true', description: 'Doctors need admin verification', numeric: false },
};

/** Hard ceilings so a stored value can never disable a safeguard entirely. */
const NUMERIC_BOUNDS: Record<string, { min: number; max: number }> = {
  max_upload_mb: { min: 1, max: 50 },
  session_ttl_hours: { min: 1, max: 720 },
};

export async function getSetting(key: string): Promise<string> {
  const def = SETTING_DEFINITIONS[key];
  if (!def) throw new Error(`Unknown setting "${key}".`);
  const row = await queryOne<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', [key]);
  return row?.value ?? def.defaultValue;
}

export async function getNumberSetting(key: string): Promise<number> {
  const raw = Number.parseInt(await getSetting(key), 10);
  const fallback = Number.parseInt(SETTING_DEFINITIONS[key].defaultValue, 10);
  const value = Number.isFinite(raw) ? raw : fallback;
  const bounds = NUMERIC_BOUNDS[key];
  return bounds ? Math.min(bounds.max, Math.max(bounds.min, value)) : value;
}

export async function getBooleanSetting(key: string): Promise<boolean> {
  return (await getSetting(key)).trim().toLowerCase() === 'true';
}
