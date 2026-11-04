import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import api, { getApiErrorMessage, isCancelled, openProtectedFile } from '../services/api.js';
import { formatServerDate } from '../utils/dates.js';
import { Button, Card, FormField, Icon, Input, fieldClasses } from '../ui/primitives.js';

interface LabReport {
  id: string;
  test_name: string;
  category: string;
  test_date: string;
  file_url: string | null;
  file_name: string | null;
  mime_type: string | null;
}

export const REPORT_CATEGORIES = ['Hematology', 'Biochemistry', 'Radiology', 'Pathology', 'Other'] as const;
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';
const MAX_MB = 10;

/** Picks the reason a file cannot be sent, or null when it is fine. */
export function fileProblem(file: File | null): string | null {
  if (!file) return 'Choose a PDF or image file.';
  if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) return 'Only PDF and image files (JPG, PNG, WebP) are allowed.';
  if (file.size > MAX_MB * 1024 * 1024) return `Files must be ${MAX_MB} MB or smaller.`;
  return null;
}

/**
 * Every test report on a patient's record, newest first. The patient can add reports;
 * their doctors (and the patient) can open each file at any time.
 */
export const TestReportsCard: React.FC<{ patientId: string; canUpload: boolean }> = ({ patientId, canUpload }) => {
  const { t: tr } = useLanguage();
  const toast = useToast();
  const formId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0]);
  const [testDate, setTestDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    api
      .get(`/lab-reports?patientId=${encodeURIComponent(patientId)}`, { signal })
      .then((res) => setReports(res.data.data ?? []))
      .catch((err) => {
        if (!isCancelled(err)) toast.error(getApiErrorMessage(err, tr('Test reports could not be loaded.')));
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, [patientId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const resetForm = () => {
    setFile(null);
    setTestName('');
    setTestDate('');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = fileProblem(file) ?? (testName.trim() ? null : 'Enter the test name.');
    if (problem || !file) {
      setError(tr(problem ?? 'Choose a PDF or image file.'));
      return;
    }
    const body = new FormData();
    body.append('patientId', patientId);
    body.append('testName', testName.trim());
    body.append('category', category);
    if (testDate) body.append('testDate', testDate);
    body.append('file', file);
    setSaving(true);
    try {
      await api.post('/lab-reports/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(tr('Report uploaded. Your doctors can now see it.'));
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, tr('The report could not be uploaded. Try again.')));
    } finally {
      setSaving(false);
    }
  };

  const open = async (report: LabReport) => {
    if (!report.file_url) return;
    try {
      await openProtectedFile(`/lab-reports/${report.id}/file`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('The file could not be opened.')));
    }
  };

  return (
    <Card padding="sm" header={{ title: tr('Test reports'), icon: <Icon.Flask size={15} />, as: 'h3' }}>
      {canUpload && !showForm && (
        <Button size="sm" block icon={<Icon.Plus size={14} />} onClick={() => setShowForm(true)} className="mb-3">
          {tr('Upload a test report')}
        </Button>
      )}

      {canUpload && showForm && (
        <form onSubmit={submit} noValidate className="mb-4 space-y-3 rounded-lg border border-hair bg-canvas/60 p-3">
          <FormField label={tr('File (PDF or image)')} htmlFor={`${formId}-file`} hint={tr('PDF, JPG, PNG or WebP, up to {mb} MB', { mb: MAX_MB })} required>
            <input
              id={`${formId}-file`}
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(''); }}
              className="block w-full text-sm text-ink-900 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-800 hover:file:bg-primary-100"
            />
          </FormField>
          <FormField label={tr('Test name')} htmlFor={`${formId}-name`} required>
            <Input id={`${formId}-name`} value={testName} maxLength={200} onChange={(e) => setTestName(e.target.value)} placeholder={tr('e.g. Complete Blood Count')} />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={tr('Type')} htmlFor={`${formId}-cat`}>
              <select id={`${formId}-cat`} value={category} onChange={(e) => setCategory(e.target.value)} className={`${fieldClasses()} h-10 rounded-md px-2 text-sm`}>
                {REPORT_CATEGORIES.map((c) => <option key={c} value={c}>{tr(c)}</option>)}
              </select>
            </FormField>
            <FormField label={tr('Test date')} htmlFor={`${formId}-date`}>
              <Input id={`${formId}-date`} type="date" value={testDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setTestDate(e.target.value)} />
            </FormField>
          </div>
          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-critical">
              <Icon.Alert size={14} className="shrink-0" /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" isLoading={saving}>{tr('Upload')}</Button>
            <Button size="sm" variant="ghost" onClick={() => { resetForm(); setShowForm(false); }}>{tr('Cancel')}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink-600">{tr('Loading...')}</p>
      ) : reports.length > 0 ? (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-hair bg-canvas/60 px-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{r.test_name}</p>
                <p className="text-xs text-ink-600">{tr(r.category)} · {formatServerDate(r.test_date)}</p>
              </div>
              {r.file_url ? (
                <Button size="sm" variant="secondary" onClick={() => open(r)} aria-label={tr('Open {name}', { name: r.test_name })}>
                  {r.mime_type === 'application/pdf' ? 'PDF' : tr('Image')}
                </Button>
              ) : (
                <span className="text-xs text-ink-600">{tr('No file')}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-600">{tr('No lab reports on record yet.')}</p>
      )}
    </Card>
  );
};
