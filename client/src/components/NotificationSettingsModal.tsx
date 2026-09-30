import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext.js';
import { useToast } from '../context/ToastContext.js';
import { Icon, Button, Badge } from '../ui/primitives.js';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useNotifications();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleToggle = async (
    key: 'criticalAlerts' | 'prescriptionUpdates' | 'labResults' | 'securityAudits' | 'soundEnabled' | 'emailDigest',
    currentVal: boolean
  ) => {
    try {
      setIsUpdating(true);
      await updateSettings({ [key]: !currentVal });
      toast.success('Preferences updated successfully');
    } catch (err) {
      toast.error('Failed to update preference');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      setIsUpdating(true);
      await updateSettings({
        criticalAlerts: true,
        prescriptionUpdates: true,
        labResults: true,
        securityAudits: true,
        soundEnabled: true,
        emailDigest: false
      });
      toast.success('Preferences reset to default values');
    } catch (err) {
      toast.error('Failed to reset preferences');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-settings-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Icon.Shield size={16} />
              </div>
              <h2 id="notif-settings-title" className="font-display text-base font-bold text-slate-900">
                Notification Preferences
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Customize real-time clinical alerts, RBAC audits, and alert delivery channels.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preferences"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Icon.X size={18} />
          </button>
        </div>

        {/* Channels List */}
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Section: Clinical & Safety Alerts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-900">
                Clinical &amp; Diagnostic Streams
              </span>
              <Badge tone="emerald" size="sm">Active RBAC</Badge>
            </div>

            <div className="space-y-3">
              {/* Critical Alerts */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">Critical Vitals &amp; Drug Allergies</span>
                    <Badge tone="crimson" size="sm">High Priority</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Immediate alerts for abnormal telemetry breaches and documented medication contraindications.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(settings.critical_alerts)}
                  disabled={isUpdating}
                  onClick={() => handleToggle('criticalAlerts', Boolean(settings.critical_alerts))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    settings.critical_alerts ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.critical_alerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Prescription Updates */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-semibold text-slate-800">Digital Prescription Sign-Offs</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Notifies when physician issues or seals a new digital prescription sheet.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(settings.prescription_updates)}
                  disabled={isUpdating}
                  onClick={() => handleToggle('prescriptionUpdates', Boolean(settings.prescription_updates))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    settings.prescription_updates ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.prescription_updates ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Lab Results */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-semibold text-slate-800">Diagnostic Laboratory Findings</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Alerts when diagnostic labs (ECG, Biochemistry, Pathology) are uploaded and verified.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(settings.lab_results)}
                  disabled={isUpdating}
                  onClick={() => handleToggle('labResults', Boolean(settings.lab_results))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    settings.lab_results ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.lab_results ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Security & Ledger Audits */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-semibold text-slate-800">Cryptographic Ledger Checkpoints</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Notifies on periodic SHA-256 integrity validation and security governance checkpoints.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(settings.security_audits)}
                  disabled={isUpdating}
                  onClick={() => handleToggle('securityAudits', Boolean(settings.security_audits))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    settings.security_audits ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.security_audits ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section: Delivery Preferences */}
          <div className="border-t border-slate-100 pt-4">
            <span className="text-xs font-semibold text-slate-900 block mb-3">
              Delivery Channels &amp; Notifications
            </span>

            <div className="space-y-3">
              {/* Sound Enabled */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-semibold text-slate-800">In-App Audio Chimes</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Play a brief acoustic chime upon receiving critical clinical alerts.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(settings.sound_enabled)}
                  disabled={isUpdating}
                  onClick={() => handleToggle('soundEnabled', Boolean(settings.sound_enabled))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    settings.sound_enabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.sound_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email Digest */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-semibold text-slate-800">Weekly Clinical Email Digest</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Deliver a consolidated summary of consultation visits and prescribed regimens to your email.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(settings.email_digest)}
                  disabled={isUpdating}
                  onClick={() => handleToggle('emailDigest', Boolean(settings.email_digest))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    settings.email_digest ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.email_digest ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            disabled={isUpdating}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;
