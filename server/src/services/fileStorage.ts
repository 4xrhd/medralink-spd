import fs from 'fs';
import path from 'path';

/**
 * Where uploaded report files live. Render's free disk is wiped on every restart, so in
 * production files go to a private Supabase Storage bucket; without its settings (local
 * development, tests) they stay in the uploads folder. The API always streams the file
 * itself after its own access check, so the bucket is never exposed to browsers.
 */
export const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const REMOTE_PREFIX = 'supabase:';

interface RemoteConfig {
  baseUrl: string;
  key: string;
  bucket: string;
}

function remoteConfig(): RemoteConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { baseUrl: url.replace(/\/+$/, ''), key, bucket: process.env.SUPABASE_STORAGE_BUCKET || 'lab-reports' };
}

export const isRemoteStorage = (): boolean => remoteConfig() !== null;

const authHeaders = (cfg: RemoteConfig) => ({ Authorization: `Bearer ${cfg.key}`, apikey: cfg.key });

let bucketReady = false;

/** Creates the private bucket once; "already exists" is the normal answer after the first run. */
async function ensureBucket(cfg: RemoteConfig): Promise<void> {
  if (bucketReady) return;
  const res = await fetch(`${cfg.baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...authHeaders(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: cfg.bucket, name: cfg.bucket, public: false }),
  });
  if (!res.ok && res.status !== 400 && res.status !== 409) {
    console.warn(`[STORAGE] could not create bucket ${cfg.bucket}: HTTP ${res.status}`);
  }
  bucketReady = true;
}

/**
 * Moves a validated upload to its permanent home and returns the value to save in file_path.
 * On failure the temp file is left for the caller to discard, and the error is thrown.
 */
export async function storeUpload(localPath: string, mimeType: string): Promise<string> {
  const cfg = remoteConfig();
  if (!cfg) return localPath;
  await ensureBucket(cfg);
  const objectName = path.basename(localPath);
  const res = await fetch(`${cfg.baseUrl}/storage/v1/object/${cfg.bucket}/${encodeURIComponent(objectName)}`, {
    method: 'POST',
    headers: { ...authHeaders(cfg), 'Content-Type': mimeType, 'x-upsert': 'false' },
    body: await fs.promises.readFile(localPath),
  });
  if (!res.ok) {
    throw new Error(`Storage upload failed: HTTP ${res.status}`);
  }
  await fs.promises.unlink(localPath).catch((err) => console.warn('[STORAGE] temp file not removed', err));
  return `${REMOTE_PREFIX}${objectName}`;
}

export type StoredFile = { kind: 'disk'; path: string } | { kind: 'buffer'; data: Buffer };

/** Reads a saved file_path back; null when there is no file or it has gone missing. */
export async function readStoredFile(storedPath: string | null): Promise<StoredFile | null> {
  if (!storedPath) return null;
  if (storedPath.startsWith(REMOTE_PREFIX)) {
    const cfg = remoteConfig();
    if (!cfg) return null;
    const objectName = path.basename(storedPath.slice(REMOTE_PREFIX.length));
    const res = await fetch(`${cfg.baseUrl}/storage/v1/object/${cfg.bucket}/${encodeURIComponent(objectName)}`, {
      method: 'GET',
      headers: authHeaders(cfg),
    });
    if (!res.ok) return null;
    return { kind: 'buffer', data: Buffer.from(await res.arrayBuffer()) };
  }
  // Only files inside the upload folder are ever sent
  const local = path.resolve(uploadDir, path.basename(storedPath));
  return fs.existsSync(local) ? { kind: 'disk', path: local } : null;
}
