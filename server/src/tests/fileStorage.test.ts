import fs from 'fs';
import os from 'os';
import path from 'path';
import { isRemoteStorage, readStoredFile, storeUpload } from '../services/fileStorage.js';

const ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET'] as const;

function tempFile(bytes: string): string {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ml-')), 'lab_test.pdf');
  fs.writeFileSync(file, bytes);
  return file;
}

describe('fileStorage', () => {
  const saved: Record<string, string | undefined> = {};
  const realFetch = global.fetch;

  beforeEach(() => ENV_KEYS.forEach((k) => { saved[k] = process.env[k]; delete process.env[k]; }));
  afterEach(() => {
    ENV_KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
    global.fetch = realFetch;
  });

  it('keeps files on local disk when Supabase is not configured', async () => {
    const file = tempFile('%PDF-local');
    expect(isRemoteStorage()).toBe(false);
    const stored = await storeUpload(file, 'application/pdf');
    expect(stored).toBe(file);
    expect(fs.existsSync(file)).toBe(true);
  });

  it('uploads to the private bucket, removes the temp file and reads it back', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co/';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    const calls: { url: string; init?: RequestInit }[] = [];
    global.fetch = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (init?.method === 'GET') return new Response('%PDF-remote', { status: 200 });
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    const file = tempFile('%PDF-remote');
    const stored = await storeUpload(file, 'application/pdf');

    expect(stored).toBe('supabase:lab_test.pdf');
    expect(fs.existsSync(file)).toBe(false);
    const upload = calls.find((c) => c.url.endsWith('/storage/v1/object/lab-reports/lab_test.pdf'));
    expect(upload?.init?.method).toBe('POST');
    expect((upload?.init?.headers as Record<string, string>).Authorization).toBe('Bearer service-key');

    const read = await readStoredFile(stored);
    expect(read?.kind).toBe('buffer');
    expect(read?.kind === 'buffer' && read.data.toString()).toBe('%PDF-remote');
  });

  it('keeps the temp file and throws when the bucket upload fails', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    global.fetch = jest.fn(async () => new Response('nope', { status: 500 })) as typeof fetch;
    const file = tempFile('%PDF-x');
    await expect(storeUpload(file, 'application/pdf')).rejects.toThrow(/storage upload failed/i);
    expect(fs.existsSync(file)).toBe(true);
  });

  it('returns null for missing files and refuses paths outside the upload folder', async () => {
    expect(await readStoredFile(null)).toBeNull();
    expect(await readStoredFile('/etc/passwd')).toBeNull();
  });
});
