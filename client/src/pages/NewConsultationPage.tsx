import { useLanguage } from '../context/LanguageContext.js';
import React, { useState, useEffect, useMemo } from 'react';
import { Alert, Select, Textarea } from '../ui/forms.js';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api, { getApiErrorMessage } from '../services/api.js';
import { Badge, Button, ButtonLink, Card, Icon, Input, PageHeader } from '../ui/primitives.js';

const COMMON_ICD10 = [
  { code: 'I10', title: 'Essential (Primary) Hypertension' },
  { code: 'E11', title: 'Type 2 Diabetes Mellitus' },
  { code: 'J06', title: 'Acute Upper Respiratory Infection' },
  { code: 'E78', title: 'Hyperlipidemia' },
  { code: 'R51', title: 'Headache' },
  { code: 'K29', title: 'Gastritis' },
];

const PRESET_LABS = ['CBC', 'Lipid Profile', 'ECG', 'HbA1c', 'Serum Creatinine', 'Chest X-Ray'];

const inputCls =
  "w-full rounded-xl border border-hair bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-50";

export const NewConsultationPage: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('New Consultation & E-Prescription'));
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const preselectedPatientId = searchParams.get('patientId') || '';
  const appointmentId = searchParams.get('appointmentId') || '';

  // Patient Selection
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Clinical Consultation Inputs
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Vitals
  const [systolicBp, setSystolicBp] = useState<number | string>('');
  const [diastolicBp, setDiastolicBp] = useState<number | string>('');
  const [heartRate, setHeartRate] = useState<number | string>('');
  const [temperature, setTemperature] = useState<number | string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<number | string>('');
  const [spo2, setSpo2] = useState<number | string>('');
  const [weightKg, setWeightKg] = useState<number | string>('');
  const [heightCm, setHeightCm] = useState<number | string>('');

  // Real-time BMI calculation matching Figma
  const bmi = useMemo(() => {
    const w = parseFloat(String(weightKg));
    const h = parseFloat(String(heightCm)) / 100;
    if (!w || !h || h <= 0) return '-';
    return (w / (h * h)).toFixed(1);
  }, [weightKg, heightCm]);

  const bmiNum = parseFloat(bmi);
  const bmiCategory = useMemo(() => {
    if (isNaN(bmiNum) || !bmiNum) return '';
    if (bmiNum < 18.5) return 'Underweight';
    if (bmiNum < 25) return 'Normal';
    if (bmiNum < 30) return 'Overweight';
    return 'Obese Class I+';
  }, [bmiNum]);

  const bmiTone = isNaN(bmiNum)
    ? 'slate'
    : bmiNum >= 25
    ? 'amber'
    : bmiNum < 18.5
    ? 'crimson'
    : 'emerald';

  const toneCls: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-50 text-warning',
    emerald: 'bg-emerald-50 text-success',
    crimson: 'bg-rose-50 text-critical',
  };

  // Diagnoses
  const [diagnoses, setDiagnoses] = useState<Array<{ icd10Code: string; diagnosisTitle: string; severity: string }>>([]);
  const [customIcd, setCustomIcd] = useState('');

  // Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState<Array<{
    id: number;
    medicationName: string;
    genericName: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
  }>>([]);
  const [rxInstructions, setRxInstructions] = useState('');

  // Lab Orders
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch patient list
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await api.get('/patients');
        const list = res.data.data || [];
        setPatients(list);
        if (!selectedPatientId && list.length > 0) {
          setSelectedPatientId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    loadPatients();
  }, [selectedPatientId]);

  // Fetch selected patient details
  useEffect(() => {
    const fetchPatient = async () => {
      if (!selectedPatientId) return;
      try {
        const res = await api.get(`/patients/${selectedPatientId}`);
        setSelectedPatient(res.data.data);
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      }
    };
    fetchPatient();
  }, [selectedPatientId]);

  const toggleDiagnosis = (code: string, title: string) => {
    const exists = diagnoses.some((d) => d.icd10Code === code);
    if (exists) {
      setDiagnoses(diagnoses.filter((d) => d.icd10Code !== code));
    } else {
      setDiagnoses([...diagnoses, { icd10Code: code, diagnosisTitle: title, severity: 'MODERATE' }]);
    }
  };

  const addCustomDiagnosis = () => {
    if (!customIcd.trim()) return;
    setDiagnoses([
      ...diagnoses,
      { icd10Code: tr('CUSTOM'), diagnosisTitle: customIcd.trim(), severity: tr('MODERATE') }
    ]);
    setCustomIcd('');
  };

  const addPrescriptionRow = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        id: Date.now(),
        medicationName: '',
        genericName: '',
        dosage: '',
        frequency: '1+0+1',
        duration: '7 Days',
        route: 'Oral',
        instructions: 'Take after meals',
      },
    ]);
  };

  const updatePrescriptionRow = (id: number, field: string, value: string) => {
    setPrescriptionItems(
      prescriptionItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removePrescriptionRow = (id: number) => {
    setPrescriptionItems(prescriptionItems.filter((item) => item.id !== id));
  };

  const toggleLab = (labName: string) => {
    if (selectedLabs.includes(labName)) {
      setSelectedLabs(selectedLabs.filter((l) => l !== labName));
    } else {
      setSelectedLabs([...selectedLabs, labName]);
    }
  };

  // Submit consultation
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chiefComplaint.trim()) {
      setError(tr('Please provide the Chief Complaint.'));
      return;
    }

    setIsSubmitting(true);
    setError(tr(''));

    try {
      const payload = {
        patientId: selectedPatientId,
        appointmentId: appointmentId || undefined,
        chiefComplaint,
        clinicalNotes,
        followUpDate: followUpDate || undefined,
        vitals: {
          systolicBp: systolicBp ? Number(systolicBp) : undefined,
          diastolicBp: diastolicBp ? Number(diastolicBp) : undefined,
          heartRate: heartRate ? Number(heartRate) : undefined,
          temperature: temperature ? Number(temperature) : undefined,
          respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
          spo2: spo2 ? Number(spo2) : undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
        },
        diagnoses,
        prescription: prescriptionItems.some((i) => i.medicationName.trim()) ? {
          instructions: rxInstructions,
          validityDays: 30,
          items: prescriptionItems
            .filter((i) => i.medicationName.trim())
            .map(({ medicationName, genericName, dosage, frequency, duration, route, instructions }) => ({
              medicationName: medicationName.trim(),
              genericName: genericName?.trim() || '',
              dosage: dosage?.trim() || '',
              frequency: frequency?.trim() || '1+0+1',
              duration: duration?.trim() || '7 Days',
              route: route || 'Oral',
              instructions: instructions?.trim() || '',
            }))
        } : undefined,
        labOrders: selectedLabs.length > 0 ? selectedLabs.map((testName) => ({
          testName,
          category: 'Diagnostic Investigation'
        })) : undefined
      };

      const res = await api.post('/consultations', payload);
      const { prescriptionId } = res.data.data || {};

      toast.success(tr('Consultation finalized & cryptographic prescription issued!'));

      if (prescriptionId) {
        navigate(`/prescription/${prescriptionId}`);
      } else {
        navigate(`/patient/timeline/${selectedPatientId}`);
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err, tr('Failed to submit consultation record.'));
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const doctorName = user?.fullName || tr('Doctor');
  const doctorLicense = user?.doctorProfile?.bmdcLicenseNumber || '-';
  const hospitalAffiliation = user?.doctorProfile?.hospitalAffiliation || '';
  const patientAllergies: any[] = selectedPatient?.allergies || [];
  const fieldLabel = 'block text-xs font-semibold text-ink-900';
  const fieldHint = 'text-xs text-ink-400';
  const mobileLabel = 'mb-1 block text-xs font-medium text-ink-600 md:hidden';

  return (
    <div className="min-h-screen bg-canvas pb-40 sm:pb-28">
      <PageHeader
        icon={<Icon.Stethoscope size={20} />}
        title={doctorName}
        meta={
          <>
            <span>
              {tr('BMDC License')}: <span className="font-mono font-semibold text-ink-900">{doctorLicense}</span>
            </span>
            {hospitalAffiliation && (
              <>
                <span className="hidden text-ink-400 sm:inline" aria-hidden="true">|</span>
                <span>{hospitalAffiliation}</span>
              </>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12">
        {error && <Alert>{error}</Alert>}

        {/* Patient in this consultation */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-700 text-sm font-semibold text-white" aria-hidden="true">
                {selectedPatient?.full_name ? selectedPatient.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : '-'}
              </div>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-semibold tracking-tight text-ink-900">{selectedPatient?.full_name || tr('Select Patient')}</span>
                  {selectedPatient?.patient_uid && <span className="font-mono text-xs text-ink-600">{selectedPatient.patient_uid}</span>}
                </p>
                {selectedPatient && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
                    {selectedPatient.blood_group && <Badge tone="crimson" size="sm">{selectedPatient.blood_group}</Badge>}
                    <span>
                      {selectedPatient.gender || '-'}
                      {selectedPatient.date_of_birth && <> · {tr('{n} yrs', { n: new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear() })}</>}
                    </span>
                    {selectedPatient.phone && <span className="font-mono">{selectedPatient.phone}</span>}
                    {selectedPatient.emergency_contact_name && (
                      <span>
                        {tr('Emergency')}: <span className="font-medium text-ink-900">{selectedPatient.emergency_contact_name}</span>
                        {selectedPatient.emergency_contact_relation && <> ({selectedPatient.emergency_contact_relation})</>}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                aria-label={tr("Select Patient")}
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                selectSize="sm"
                className="sm:w-64"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.patient_uid})
                  </option>
                ))}
              </Select>
              {selectedPatientId && (
                <ButtonLink size="sm" variant="secondary" to={`/patient/timeline/${selectedPatientId}`}>
                  {tr("View Full Timeline")}
                </ButtonLink>
              )}
            </div>
          </div>

          {/* The patient's real allergies, always in view while prescribing */}
          {selectedPatient && (
            <div className="flex flex-wrap items-center gap-2 border-t border-hair bg-canvas/60 px-4 py-2.5 text-xs sm:px-5">
              <Icon.Alert size={14} className={patientAllergies.length ? 'text-critical' : 'text-ink-400'} />
              <span className="font-semibold text-ink-900">{tr('Allergy Alert')}:</span>
              {patientAllergies.length > 0 ? (
                patientAllergies.map((a, i) => (
                  <Badge key={i} tone="crimson" size="sm" dot>
                    {a.allergen}{a.severity ? ` (${a.severity})` : ''}
                  </Badge>
                ))
              ) : (
                <span className="text-ink-600">{tr("No known drug allergies (NKDA)")}</span>
              )}
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[minmax(0,560px)_1fr]">
          {/* Left: observations, vitals, diagnosis */}
          <Card
            padding="md"
            header={{
              title: tr("Clinical Observations & Telemetry"),
              description: tr("Capture symptoms, examination findings, and vitals matrix"),
              icon: <Icon.Activity size={15} />,
            }}
          >
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <label htmlFor="consult-complaint" className={fieldLabel}>
                    {tr("Chief Complaints")} <span className="text-critical" aria-hidden="true">*</span>
                  </label>
                  <span className={fieldHint}>{tr("Primary patient symptoms")}</span>
                </div>
                <Textarea
                  rows={3}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder={tr("e.g. Mild exertional chest tightness and occipital headaches for 2 weeks...")}
                  id="consult-complaint"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <label htmlFor="consult-notes" className={fieldLabel}>{tr("Clinical Examination & Diagnosis Notes")}</label>
                  <span className={fieldHint}>{tr("Physical examination findings")}</span>
                </div>
                <Textarea
                  rows={4}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder={tr("Examination findings, physical status, cardiovascular auscultation...")}
                  id="consult-notes"
                  className="mt-1.5"
                />
              </div>

              <fieldset>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <legend className={fieldLabel}>{tr("Vitals Capture Matrix")}</legend>
                  <Badge tone="blue" size="sm">{tr("Auto-Computed BMI")}</Badge>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: tr('Systolic BP'), unit: 'mmHg', val: systolicBp, set: setSystolicBp, ph: '120' },
                    { label: tr('Diastolic BP'), unit: 'mmHg', val: diastolicBp, set: setDiastolicBp, ph: '80' },
                    { label: tr('Heart Rate'), unit: 'bpm', val: heartRate, set: setHeartRate, ph: '72' },
                    { label: tr('Temperature'), unit: '°C', val: temperature, set: setTemperature, ph: '36.6' },
                    { label: tr('Resp Rate'), unit: '/min', val: respiratoryRate, set: setRespiratoryRate, ph: '16' },
                    { label: tr('SpO₂'), unit: '%', val: spo2, set: setSpo2, ph: '98' },
                    { label: tr('Weight'), unit: 'kg', val: weightKg, set: setWeightKg, ph: '70' },
                    { label: tr('Height'), unit: 'cm', val: heightCm, set: setHeightCm, ph: '170' },
                  ].map((v) => (
                    <label
                      key={v.label}
                      className="block cursor-text rounded-lg border border-hair bg-canvas/60 px-3 py-2.5 transition-colors hover:border-hair-strong focus-within:border-primary-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100"
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-medium text-ink-600">{v.label}</span>
                        <span className="font-mono text-[0.6875rem] text-ink-400">{v.unit}</span>
                      </span>
                      <input
                        aria-label={`${v.label} (${v.unit})`}
                        value={v.val}
                        onChange={(e) => v.set(e.target.value)}
                        inputMode="decimal"
                        placeholder={v.ph}
                        className="mt-1 w-full bg-transparent font-display text-xl font-semibold text-ink-900 tabular outline-none placeholder:text-hair-strong"
                      />
                    </label>
                  ))}
                </div>

                <div className={`mt-3 flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 ${toneCls[bmiTone]}`} aria-live="polite">
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    {tr('Computed BMI')}
                    {bmiCategory && <span className="rounded-md bg-white/80 px-2 py-0.5 text-xs font-semibold">{tr(bmiCategory)}</span>}
                  </span>
                  <span className="font-display text-base font-semibold tabular">{bmi} kg/m²</span>
                </div>
              </fieldset>

              <fieldset>
                <legend className={fieldLabel}>{tr("ICD-10 Diagnosis Codification")}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COMMON_ICD10.map((item) => {
                    const on = diagnoses.some((d) => d.icd10Code === item.code);
                    return (
                      <button
                        key={item.code}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDiagnosis(item.code, item.title)}
                        className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 [@media(pointer:coarse)]:min-h-10 ${
                          on ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-hair bg-white text-ink-600 hover:border-hair-strong hover:text-ink-900'
                        }`}
                      >
                        {on && <Icon.Check size={12} />}
                        <span className="font-mono">{item.code}</span> {tr(item.title)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2">
                  <Input
                    inputSize="sm"
                    aria-label={tr("Search or add custom ICD-10 diagnosis")}
                    value={customIcd}
                    onChange={(e) => setCustomIcd(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomDiagnosis())}
                    placeholder={tr("Search or add custom ICD-10 diagnosis")}
                    leftIcon={<Icon.Search size={14} />}
                  />
                  <Button size="sm" variant="secondary" onClick={addCustomDiagnosis} disabled={!customIcd.trim()}>
                    {tr("Add")}
                  </Button>
                </div>
              </fieldset>
            </div>
          </Card>

          {/* Right: prescription builder */}
          <Card
            padding="md"
            header={{
              title: tr("Electronic Prescription Formulation"),
              description: tr("Valid BMDC digital medication regimen"),
              icon: <span className="font-serif text-base font-bold">℞</span>,
            }}
          >
            <div className="space-y-6">
              <div className="rounded-lg border border-hair" role="group" aria-label={tr("Prescription medicine table")}>
                <div className="hidden grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_1.3fr_2rem] gap-2 border-b border-hair bg-canvas px-3 py-2 text-xs font-semibold text-ink-600 md:grid" aria-hidden="true">
                  <span>{tr("Medicine Name")}</span>
                  <span>{tr("Dosage")}</span>
                  <span>{tr("Frequency")}</span>
                  <span>{tr("Duration")}</span>
                  <span>{tr("Instructions")}</span>
                  <span />
                </div>

                {prescriptionItems.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-ink-900">{tr("No medications added to this prescription yet")}</p>
                    <p className="mt-1 text-xs text-ink-600">{tr("Click \"+ Add Medicine Row\" below to prescribe medicines for this consultation.")}</p>
                  </div>
                ) : (
                  <ol className="divide-y divide-hair">
                    {prescriptionItems.map((item, idx) => (
                      // Phones: each medicine is a small labelled card. md and up: one table row.
                      <li key={item.id} className="grid grid-cols-2 gap-2 p-3 md:grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_1.3fr_2rem] md:items-center md:py-2">
                        <div className="col-span-2 flex items-center justify-between md:hidden">
                          <span className="text-xs font-semibold text-ink-900">#{idx + 1}</span>
                          <Button size="sm" variant="ghost" aria-label={tr("Delete medicine row")} onClick={() => removePrescriptionRow(item.id)} icon={<Icon.Trash size={14} />}>
                            <span className="sr-only">{tr("Delete medicine row")}</span>
                          </Button>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <span className={mobileLabel} aria-hidden="true">{tr("Medicine Name")}</span>
                          <Input inputSize="sm" aria-label={tr("Medicine Name")} value={item.medicationName} onChange={(e) => updatePrescriptionRow(item.id, 'medicationName', e.target.value)} placeholder={tr("e.g. Tab. Amlocard")} />
                        </div>
                        <div>
                          <span className={mobileLabel} aria-hidden="true">{tr("Dosage")}</span>
                          <Input inputSize="sm" aria-label={tr("Dosage")} value={item.dosage} onChange={(e) => updatePrescriptionRow(item.id, 'dosage', e.target.value)} placeholder="5mg" />
                        </div>
                        <div>
                          <span className={mobileLabel} aria-hidden="true">{tr("Frequency")}</span>
                          <Input inputSize="sm" aria-label={tr("Frequency")} value={item.frequency} onChange={(e) => updatePrescriptionRow(item.id, 'frequency', e.target.value)} placeholder="1+0+0" className="font-mono tabular" />
                        </div>
                        <div>
                          <span className={mobileLabel} aria-hidden="true">{tr("Duration")}</span>
                          <Input inputSize="sm" aria-label={tr("Duration")} value={item.duration} onChange={(e) => updatePrescriptionRow(item.id, 'duration', e.target.value)} placeholder="30 Days" />
                        </div>
                        <div>
                          <span className={mobileLabel} aria-hidden="true">{tr("Instructions")}</span>
                          <Input inputSize="sm" aria-label={tr("Instructions")} value={item.instructions} onChange={(e) => updatePrescriptionRow(item.id, 'instructions', e.target.value)} placeholder={tr("After breakfast")} />
                        </div>
                        <button
                          type="button"
                          aria-label={tr("Delete medicine row")}
                          title={tr("Remove medicine row")}
                          onClick={() => removePrescriptionRow(item.id)}
                          className="hidden h-8 w-8 place-items-center rounded-md text-ink-400 transition-colors hover:bg-rose-50 hover:text-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-critical md:grid"
                        >
                          <Icon.Trash size={14} />
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-ink-600">{tr('Quick Dosage Frequency')}:</span>
                {[
                  ['1+0+0', 'Morning'],
                  ['1+0+1', 'Morning & Night'],
                  ['1+1+1', 'Three times daily'],
                  ['0+0+1', 'Night (HS)'],
                  ['1 PRN', 'As needed'],
                ].map(([freq, tip]) => (
                  <button
                    key={freq}
                    type="button"
                    disabled={prescriptionItems.length === 0}
                    onClick={() => updatePrescriptionRow(prescriptionItems[prescriptionItems.length - 1].id, 'frequency', freq)}
                    className="h-7 rounded-md border border-hair bg-white px-2 font-mono text-xs font-semibold text-primary-700 transition-colors hover:border-primary-600 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50 [@media(pointer:coarse)]:h-9"
                    title={tr('Apply {freq} ({tip}) to row', { freq, tip: tr(tip) })}
                  >
                    {freq}
                  </button>
                ))}
              </div>

              <Button variant="outline" block onClick={addPrescriptionRow} icon={<Icon.Plus size={15} />} className="border-dashed">
                {tr("Add Medicine Row")}
              </Button>

              <div>
                <label htmlFor="consult-advice" className={fieldLabel}>{tr("Lifestyle & Dietary Advice")}</label>
                <Textarea
                  id="consult-advice"
                  rows={3}
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  placeholder={tr("e.g. Low sodium diet, brisk walking 30 minutes daily, monitor BP twice weekly.")}
                  className="mt-1.5"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="follow-up-date" className={fieldLabel}>{tr("Scheduled Chamber Follow-up")}</label>
                  <Input id="follow-up-date" type="date" inputSize="sm" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="mt-1.5" />
                </div>
                <fieldset>
                  <legend className={fieldLabel}>{tr("Diagnostic Laboratory Requisition")}</legend>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {PRESET_LABS.map((lab) => {
                      const on = selectedLabs.includes(lab);
                      return (
                        <button
                          key={lab}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleLab(lab)}
                          className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 [@media(pointer:coarse)]:h-10 ${
                            on ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-hair bg-white text-ink-600 hover:border-hair-strong hover:text-ink-900'
                          }`}
                        >
                          {on && <Icon.Check size={12} />}
                          {lab}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Sticky action bar: real readiness state on the left, actions on the right */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hair bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex max-w-[1720px] flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 2xl:px-12">
          <p className="flex items-center gap-2 text-sm text-ink-600" aria-live="polite">
            {chiefComplaint.trim() ? (
              <>
                <Icon.Check size={16} className="shrink-0 text-success" />
                <span>{tr("Ready to issue")}</span>
              </>
            ) : (
              <>
                <Icon.Alert size={16} className="shrink-0 text-warning" />
                <span>{tr("Add the chief complaint to issue this prescription")}</span>
              </>
            )}
          </p>
          <div className="grid grid-cols-[auto_1fr] gap-2 sm:flex">
            <Button variant="secondary" onClick={() => navigate('/doctor')}>
              {tr("Cancel")}
            </Button>
            <Button disabled={isSubmitting} isLoading={isSubmitting} onClick={() => handleSubmit()} icon={<Icon.Lock size={15} />} className="h-auto min-h-[2.375rem] min-w-0 whitespace-normal py-2 text-left leading-snug">
              {isSubmitting ? tr('Digitally Signing & Issuing...') : tr('Finalize, Digitally Sign & Issue Prescription')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
