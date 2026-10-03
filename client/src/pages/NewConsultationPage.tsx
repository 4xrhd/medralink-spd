import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api from '../services/api.js';
import { Card, Icon, Pill, Badge, Button, VitalPill } from '../ui/primitives.js';

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
  useDocumentTitle('New Consultation & E-Prescription');
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
      { icd10Code: 'CUSTOM', diagnosisTitle: customIcd.trim(), severity: 'MODERATE' }
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
      setError('Please provide the Chief Complaint.');
      return;
    }

    setIsSubmitting(true);
    setError('');

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

      toast.success('Consultation finalized & cryptographic prescription issued!');

      if (prescriptionId) {
        navigate(`/prescription/${prescriptionId}`);
      } else {
        navigate(`/patient/timeline/${selectedPatientId}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit consultation record.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const doctorName = user?.fullName || 'Dr. Ahmed Tariq, MBBS, FCPS';
  const doctorLicense = user?.doctorProfile?.bmdcLicenseNumber || 'A-54921';
  const hospitalAffiliation = user?.doctorProfile?.hospitalAffiliation || 'Square Hospital / NICVD';

  return (
    <div className="min-h-screen bg-canvas pb-28">
      {/* Attending Physician Letterhead Banner */}
      <section aria-label="Attending Physician Letterhead" className="border-b border-hair bg-white">
        <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-700 text-white shadow-sm">
              <Icon.Stethoscope size={18} />
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink-900">{doctorName}</p>
              <p className="text-xs text-ink-600">
                BMDC License: <span className="font-mono font-semibold text-ink-900">{doctorLicense}</span> • {hospitalAffiliation}
              </p>
            </div>
          </div>
          <Pill tone="emerald">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Active Clinical Session • Room 402
          </Pill>
        </div>
      </section>

      <main className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 2xl:px-12">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
            <Icon.Alert size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Selection & Identification Card */}
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-700 font-bold text-white">
                {selectedPatient?.full_name ? selectedPatient.full_name.slice(0, 2).toUpperCase() : 'RA'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold text-ink-900">
                    {selectedPatient?.full_name || 'Rahim Ahmed'}
                  </span>
                  <span className="font-mono text-xs text-ink-400">
                    {selectedPatient?.patient_uid || 'P-1001'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Pill tone="crimson">{selectedPatient?.blood_group || 'O+'}</Pill>
                  <span className="text-ink-600">
                    {selectedPatient?.gender || 'Male'} •{' '}
                    {selectedPatient?.date_of_birth ? `${new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} Yrs` : '45 Yrs'}
                  </span>
                  <span className="text-ink-400">| 📱 {selectedPatient?.phone || '+8801712345678'}</span>
                </div>
              </div>
            </div>

            {/* Center Clinical Safety & Emergency Telemetry (Fills empty space on 1920px) */}
            <div className="hidden 2xl:flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 text-xs">
                <span className="font-bold text-amber-800">Allergy Alert:</span>
                <span className="font-semibold text-warning">Penicillin (Severe)</span>
                <span className="text-amber-400">•</span>
                <span className="font-semibold text-warning">Sulfa Drugs</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-ink-400">Emergency:</span>
                <span className="font-semibold text-ink-900">{selectedPatient?.emergency_contact_name || 'Nasreen Ahmed'}</span>
                <span className="text-ink-600">({selectedPatient?.emergency_contact_relation || 'Spouse'})</span>
                <span className="font-mono text-primary-600">{selectedPatient?.emergency_contact_phone || '+8801712345678'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">
                Switch Patient:
              </label>
              <select
                aria-label="Select Patient"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="rounded-xl border border-hair bg-canvas px-3 py-2 text-xs font-semibold text-ink-900 outline-none focus:border-primary-600"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.patient_uid})
                  </option>
                ))}
              </select>
              <Link
                to={`/patient/timeline/${selectedPatientId}`}
                className="rounded-xl border border-hair bg-white px-3 py-2 text-xs font-semibold text-primary-700 transition-colors hover:border-hair-strong"
              >
                View Full Timeline
              </Link>
            </div>
          </div>
        </Card>

        {/* Figma Two-Column Clinical Layout */}
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[560px_1fr]">
          {/* Left Column: Clinical Observations & Telemetry */}
          <Card className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ink-900">Clinical Observations &amp; Telemetry</h3>
                <p className="mt-0.5 text-xs text-ink-600">Capture symptoms, examination findings, and vitals matrix</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Telemetry Active
              </span>
            </div>

            {/* Chief Complaints */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Chief Complaints
                </label>
                <span className="text-[10px] font-medium text-ink-400">Primary patient symptoms</span>
              </div>
              <textarea
                rows={3}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Mild exertional chest tightness and occipital headaches for 2 weeks..."
                className="mt-1.5 w-full min-h-[80px] rounded-xl border border-hair bg-white p-3 text-sm leading-relaxed text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-50 resize-y"
              />
            </div>

            {/* Clinical Examination & Diagnosis Notes */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Clinical Examination &amp; Diagnosis Notes
                </label>
                <span className="text-[10px] font-medium text-ink-400">Physical examination findings</span>
              </div>
              <textarea
                rows={4}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Examination findings, physical status, cardiovascular auscultation..."
                className="mt-1.5 w-full min-h-[108px] rounded-xl border border-hair bg-white p-3 text-sm leading-relaxed text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-50 resize-y"
              />
            </div>

            {/* Vitals Capture Matrix (4x2 grid with Real-Time BMI indicator) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Vitals Capture Matrix
                </label>
                <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-600">
                  <Icon.Activity size={12} /> Auto-Computed BMI
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Systolic BP', unit: 'mmHg', val: systolicBp, set: setSystolicBp, ph: '120' },
                  { label: 'Diastolic BP', unit: 'mmHg', val: diastolicBp, set: setDiastolicBp, ph: '80' },
                  { label: 'Heart Rate', unit: 'bpm', val: heartRate, set: setHeartRate, ph: '72' },
                  { label: 'Temperature', unit: '°C', val: temperature, set: setTemperature, ph: '36.6' },
                  { label: 'Resp Rate', unit: '/min', val: respiratoryRate, set: setRespiratoryRate, ph: '16' },
                  { label: 'SpO₂', unit: '%', val: spo2, set: setSpo2, ph: '98' },
                  { label: 'Weight', unit: 'kg', val: weightKg, set: setWeightKg, ph: '70' },
                  { label: 'Height', unit: 'cm', val: heightCm, set: setHeightCm, ph: '170' },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="flex flex-col justify-between rounded-xl border border-hair bg-canvas p-3 transition-all hover:border-hair-strong focus-within:border-primary-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-50 focus-within:shadow-xs min-h-[76px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-600">
                        {v.label}
                      </span>
                      <span className="rounded bg-slate-200/70 px-2 py-0.5 font-mono text-[10px] font-bold text-ink-600">
                        {v.unit}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <input
                        aria-label={`${v.label} in ${v.unit}`}
                        value={v.val}
                        onChange={(e) => v.set(e.target.value)}
                        inputMode="decimal"
                        placeholder={v.ph}
                        className="w-full tabular bg-transparent font-display text-xl sm:text-2xl font-bold text-ink-900 outline-none placeholder:text-hair-strong"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-time BMI Display Badge */}
              <div className={`mt-3 flex items-center justify-between rounded-xl px-4 py-2.5 ${toneCls[bmiTone]} shadow-2xs`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Computed BMI:</span>
                  {bmiCategory && (
                    <span className="rounded-md bg-white/80 px-2 py-0.5 text-xs font-extrabold shadow-xs">
                      {bmiCategory}
                    </span>
                  )}
                </div>
                <span className="tabular font-display text-base font-extrabold">{bmi} kg/m²</span>
              </div>
            </div>

            {/* ICD-10 Diagnosis Codification */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                ICD-10 Diagnosis Codification
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_ICD10.map((item) => {
                  const on = diagnoses.some((d) => d.icd10Code === item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDiagnosis(item.code, item.title)}
                      className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        on
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-hair bg-white text-ink-600 hover:border-hair-strong'
                      }`}
                    >
                      {on && <Icon.Check size={12} className="mr-1 inline" />}
                      [{item.code}] {item.title}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-hair-strong px-3 py-2 bg-white">
                <Icon.Search size={16} className="text-ink-400" />
                <input
                  aria-label="Search or add custom ICD-10 diagnosis"
                  value={customIcd}
                  onChange={(e) => setCustomIcd(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomDiagnosis())}
                  placeholder="+ Type custom diagnosis & press Enter..."
                  className="w-full bg-transparent text-xs outline-none placeholder:text-ink-400"
                />
                {customIcd && (
                  <button
                    type="button"
                    onClick={addCustomDiagnosis}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Right Column: Structured E-Prescription Builder */}
          <Card className="space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-hair pb-3">
              <div className="flex items-center gap-2">
                <span className="font-serif text-3xl font-bold text-primary-700">℞</span>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink-900">Electronic Prescription Formulation</h3>
                  <p className="text-xs text-ink-600">Valid BMDC digital medication regimen</p>
                </div>
              </div>
              <Pill tone="emerald">Verified Regimen</Pill>
            </div>

            {/* Dynamic Medication Table */}
            <div className="overflow-x-auto rounded-xl border border-hair" aria-label="Prescription medicine table">
              <div className="grid min-w-[620px] grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_1.3fr_auto] gap-2 bg-canvas px-3.5 py-2.5 text-xs font-semibold text-slate-600">
                <span>Medicine Name</span>
                <span>Dosage</span>
                <span>Frequency</span>
                <span>Duration</span>
                <span>Instructions</span>
                <span />
              </div>

              <div className="min-w-[620px] divide-y divide-hair">
                {prescriptionItems.length === 0 ? (
                  <div className="py-8 text-center bg-white px-4">
                    <p className="text-xs font-semibold text-ink-900">No medications added to this prescription yet</p>
                    <p className="mt-1 text-[11px] text-ink-600">
                      Click "+ Add Medication Item" below to prescribe medicines for this consultation.
                    </p>
                  </div>
                ) : (
                  prescriptionItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_1.3fr_auto] items-center gap-2 px-3 py-2">
                      <input
                        aria-label="Medicine Name"
                        value={item.medicationName}
                        onChange={(e) => updatePrescriptionRow(item.id, 'medicationName', e.target.value)}
                        placeholder="e.g. Tab. Amlocard"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-900 shadow-2xs outline-none transition-all focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                      />
                      <input
                        aria-label="Dosage"
                        value={item.dosage}
                        onChange={(e) => updatePrescriptionRow(item.id, 'dosage', e.target.value)}
                        placeholder="5mg"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-ink-900 shadow-2xs outline-none transition-all focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                      />
                      <input
                        aria-label="Frequency"
                        value={item.frequency}
                        onChange={(e) => updatePrescriptionRow(item.id, 'frequency', e.target.value)}
                        placeholder="1+0+0"
                        className="tabular font-mono text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-ink-900 shadow-2xs outline-none transition-all focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                      />
                      <input
                        aria-label="Duration"
                        value={item.duration}
                        onChange={(e) => updatePrescriptionRow(item.id, 'duration', e.target.value)}
                        placeholder="30 Days"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-ink-900 shadow-2xs outline-none transition-all focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                      />
                      <input
                        aria-label="Instructions"
                        value={item.instructions}
                        onChange={(e) => updatePrescriptionRow(item.id, 'instructions', e.target.value)}
                        placeholder="After breakfast"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-ink-900 shadow-2xs outline-none transition-all focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                      />
                      <button
                        type="button"
                        aria-label="Delete medicine row"
                        onClick={() => removePrescriptionRow(item.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg transition-colors text-ink-400 hover:bg-rose-50 hover:text-critical"
                        title="Remove medicine row"
                      >
                        <Icon.Trash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Frequency Helper Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-semibold text-ink-600">Quick Dosage Frequency:</span>
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
                  onClick={() => {
                    if (prescriptionItems.length > 0) {
                      const lastId = prescriptionItems[prescriptionItems.length - 1].id;
                      updatePrescriptionRow(lastId, 'frequency', freq);
                    }
                  }}
                  className="rounded-lg border border-hair bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-700 hover:bg-slate-50 hover:border-primary-600 transition-colors"
                  title={`Apply ${freq} (${tip}) to row`}
                >
                  {freq}
                </button>
              ))}
            </div>

            {/* Add Medicine Row Button */}
            <button
              type="button"
              onClick={addPrescriptionRow}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-hair-strong py-2.5 text-xs font-semibold text-primary-600 transition-colors hover:border-primary-600 hover:bg-primary-50"
            >
              <Icon.Plus size={15} /> Add Medicine Row
            </button>

            {/* Lifestyle & Dietary Advice */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Lifestyle &amp; Dietary Advice
              </label>
              <textarea
                rows={3}
                value={rxInstructions}
                onChange={(e) => setRxInstructions(e.target.value)}
                placeholder="e.g. Low sodium diet, brisk walking 30 minutes daily, monitor BP twice weekly."
                className="mt-1.5 w-full min-h-[80px] rounded-xl border border-hair bg-white p-3 text-sm leading-relaxed text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-50 resize-y"
              />
            </div>

            {/* Follow-up recommendation */}
            <div className="flex items-center justify-between rounded-xl border border-hair bg-canvas p-3">
              <span className="text-xs font-semibold text-ink-600">Scheduled Chamber Follow-up</span>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="rounded-lg border border-hair bg-white px-2.5 py-1 text-xs font-medium text-ink-900 outline-none"
              />
            </div>

            {/* Diagnostic Laboratory Requisition */}
            <div className="rounded-xl border border-hair bg-canvas p-4">
              <p className="text-xs font-semibold text-slate-700">
                Diagnostic Laboratory Requisition
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_LABS.map((lab) => {
                  const on = selectedLabs.includes(lab);
                  return (
                    <button
                      key={lab}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleLab(lab)}
                      className={`min-h-8 rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                        on
                          ? 'border-audit bg-violet-50 text-audit'
                          : 'border-hair bg-white text-ink-600 hover:border-hair-strong'
                      }`}
                    >
                      {on && <Icon.Check size={12} className="mr-1 inline" />}
                      {lab}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Figma Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-hair bg-white/95 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8 2xl:px-12">
          <p className="flex items-center gap-2 text-xs sm:text-sm text-ink-600">
            <Icon.Check size={16} className="text-success" />
            <span>All mandatory clinical fields verified</span>
            <span className="text-ink-400">•</span>
            <span className="inline-flex items-center gap-1 text-ink-400">
              <Icon.Clock size={14} /> Autosaved 1m ago
            </span>
          </p>

          <div className="flex w-full gap-3 sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => navigate('/doctor')}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={() => handleSubmit()}
              icon={<Icon.Lock size={16} />}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? 'Digitally Signing & Issuing...' : 'Finalize, Digitally Sign & Issue Prescription'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
