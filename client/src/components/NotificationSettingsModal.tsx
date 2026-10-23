import { useLanguage } from '../context/LanguageContext.js';
import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../ui/primitives.js';
import { Switch } from '../ui/forms.js';
import { Modal } from '../ui/modal.js';

type SettingKey = 'criticalAlerts' | 'prescriptionUpdates' | 'labResults' | 'securityAudits' | 'soundEnabled' | 'emailDigest';
type StoredKey = 'critical_alerts' | 'prescription_updates' | 'lab_results' | 'security_audits' | 'sound_enabled' | 'email_digest';
interface Preference { key: SettingKey; setting: StoredKey; label: string; description: string }

const CLINICAL_STREAMS: Preference[] = [
  { key: 'criticalAlerts', setting: 'critical_alerts', label: 'Critical vitals and drug allergies', description: 'Immediate alerts for abnormal vitals and documented medication allergies.' },
  { key: 'prescriptionUpdates', setting: 'prescription_updates', label: 'Prescriptions', description: 'When a doctor issues or signs a new prescription.' },
  { key: 'labResults', setting: 'lab_results', label: 'Lab results', description: 'When a lab report (ECG, biochemistry, pathology) is uploaded.' },
  { key: 'securityAudits', setting: 'security_audits', label: 'Audit checkpoints', description: 'Audit log integrity checks and security events.' },
];

const DELIVERY_OPTIONS: Preference[] = [
  { key: 'soundEnabled', setting: 'sound_enabled', label: 'Sound', description: 'Play a short chime for critical alerts.' },
  { key: 'emailDigest', setting: 'email_digest', label: 'Weekly email summary', description: 'A summary of visits and prescriptions sent to your email.' },
];

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t: tr } = useLanguage();
  const { settings, updateSettings } = useNotifications();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (key: SettingKey, currentVal: boolean) => {
    try {
      setIsUpdating(true);
      await updateSettings({ [key]: !currentVal });
      toast.success(tr('Preferences updated successfully'));
    } catch (err) {
      toast.error(tr('Failed to update preference'));
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
      toast.success(tr('Preferences reset to default values'));
    } catch (err) {
      toast.error(tr('Failed to reset preferences'));
    } finally {
      setIsUpdating(false);
    }
  };

  const group = (items: typeof CLINICAL_STREAMS) =>
    items.map((item) => (
      <Switch
        key={item.key}
        id={`notif-${item.key}`}
        label={tr(item.label)}
        description={tr(item.description)}
        checked={Boolean(settings[item.setting])}
        disabled={isUpdating}
        onChange={() => handleToggle(item.key, Boolean(settings[item.setting]))}
      />
    ));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tr("Notification preferences")}
      description={tr("Choose which alerts you receive and how they reach you.")}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleResetDefaults} disabled={isUpdating} className="mr-auto">
            {tr("Reset to defaults")}
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            {tr("Done")}
          </Button>
        </>
      }
    >
      <div className="max-h-[50vh] space-y-5 overflow-y-auto pr-1">
        <section aria-labelledby="notif-clinical-heading" className="space-y-3">
          <h3 id="notif-clinical-heading" className="text-sm font-semibold text-ink-900">{tr("Clinical alerts")}</h3>
          {group(CLINICAL_STREAMS)}
        </section>
        <section aria-labelledby="notif-delivery-heading" className="space-y-3">
          <h3 id="notif-delivery-heading" className="text-sm font-semibold text-ink-900">{tr("Delivery")}</h3>
          {group(DELIVERY_OPTIONS)}
        </section>
      </div>
    </Modal>
  );
};
