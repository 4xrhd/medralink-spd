import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { Card, Icon, Pill, VitalPill } from '../ui/primitives.js';

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
  "w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#EFF6FF]";

export const NewConsultationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const preselectedPatientId = searchParams.get('patientId') || 'pat-1';
  const appointmentId = searchParams.get('appointmentId') || '';

  // Patient Selection
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Clinical Consultation Inputs
  const [chiefComplaint, setChiefComplaint] = useState('Mild exertional chest tightness and occipital headaches for 2 weeks.');
  const [clinicalNotes, setClinicalNotes] = useState('Alert, oriented. S1S2 normal, no murmurs. Elevated BP on repeat measurement. Advise antihypertensive initiation and lifestyle modification.');
  const [followUpDate, setFollowUpDate] = useState('2026-09-18');

  // Vitals
  const [systolicBp, setSystolicBp] = useState<number | string>(145);
  const [diastolicBp, setDiastolicBp] = useState<number | string>(92);
  const [heartRate, setHeartRate] = useState<number | string>(78);
  const [temperature, setTemperature] = useState<number | string>(36.8);
  const [respiratoryRate, setRespiratoryRate] = useState<number | string>(16);
  const [spo2, setSpo2] = useState<number | string>(98);
  const [weightKg, setWeightKg] = useState<number | string>(76.5);
  const [heightCm, setHeightCm] = useState<number | string>(172);

  // Real-time BMI calculation matching Figma
  const bmi = useMemo(() => {
    const w = parseFloat(String(weightKg));
    const h = parseFloat(String(heightCm)) / 100;
    if (!w || !h || h <= 0) return '—';
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
    amber: 'bg-[#FEF3C7] text-[#B45309]',
    emerald: 'bg-[#ECFDF5] text-[#059669]',
    crimson: 'bg-[#FEF2F2] text-[#DC2626]',
  };

  // Diagnoses
  const [diagnoses, setDiagnoses] = useState<Array<{ icd10Code: string; diagnosisTitle: string; severity: string }>>([
    { icd10Code: 'I10', diagnosisTitle: 'Essential (Primary) Hypertension', severity: 'MODERATE' }
  ]);
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
  }>>([
    {
      id: 1,
      medicationName: 'Tab. Amlocard',
      genericName: 'Amlodipine Besylate',
      dosage: '5mg',
      frequency: '1+0+0',
      duration: '30 Days',
      route: 'Oral',
      instructions: 'Take after breakfast'
    },
    {
      id: 2,
      medicationName: 'Tab. Napa Extra',
      genericName: 'Paracetamol + Caffeine',
      dosage: '565mg',
      frequency: '1+0+1',
      duration: '5 Days',
      route: 'Oral',
      instructions: 'Take after meals PRN'
    }
  ]);
  const [rxInstructions, setRxInstructions] = useState('Maintain low sodium diet, brisk walking 30 minutes daily, monitor BP twice weekly.');

  // Lab Orders
  const [selectedLabs, setSelectedLabs] = useState<string[]>(['Lipid Profile', 'ECG']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch patient list
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data.data || []);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    loadPatients();
  }, []);

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
        dosage: '5mg',
        frequency: '1+0+0',
        duration: '14 Days',
        route: 'Oral',
        instructions: 'Take after food'
      }
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
        prescription: prescriptionItems.length > 0 ? {
          instructions: rxInstructions,
          validityDays: 30,
          items: prescriptionItems.map(({ medicationName, genericName, dosage, frequency, duration, route, instructions }) => ({
            medicationName: medicationName || 'Prescribed Drug',
            genericName: genericName || 'Generic Form',
            dosage,
            frequency,
            duration,
            route: route || 'Oral',
            instructions
          }))
        } : undefined,
        labOrders: selectedLabs.length > 0 ? selectedLabs.map((testName) => ({
          testName,
          category: 'Diagnostic Investigation'
        })) : undefined
      };

      const res = await api.post('/consultations', payload);
      const { prescriptionId } = res.data.data || {};

      if (prescriptionId) {
        navigate(`/prescription/${prescriptionId}`);
      } else {
        navigate(`/patient/timeline/${selectedPatientId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit consultation record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const doctorName = user?.fullName || 'Dr. Ahmed Tariq, MBBS, FCPS';
  const doctorLicense = user?.doctorProfile?.bmdcLicenseNumber || 'A-54921';
  const hospitalAffiliation = user?.doctorProfile?.hospitalAffiliation || 'Square Hospital / NICVD';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Attending Physician Letterhead Banner */}
      <section aria-label="Attending Physician Letterhead" className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1B365D] text-white shadow-sm">
              <Icon.Stethoscope size={18} />
            </div>
            <div>
              <p className="font-display text-base font-bold text-[#0F172A]">{doctorName}</p>
              <p className="text-xs text-[#475569]">
                BMDC License: <span className="font-mono font-semibold text-[#0F172A]">{doctorLicense}</span> • {hospitalAffiliation}
              </p>
            </div>
          </div>
          <Pill tone="emerald">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#059669]" /> Active Clinical Session • Room 402
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
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#1B365D] font-bold text-white">
                {selectedPatient?.full_name ? selectedPatient.full_name.slice(0, 2).toUpperCase() : 'RA'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold text-[#0F172A]">
                    {selectedPatient?.full_name || 'Rahim Ahmed'}
                  </span>
                  <span className="font-mono text-xs text-[#94A3B8]">
                    {selectedPatient?.patient_uid || 'P-1001'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Pill tone="crimson">{selectedPatient?.blood_group || 'O+'}</Pill>
                  <span className="text-[#475569]">
                    {selectedPatient?.gender || 'Male'} •{' '}
                    {selectedPatient?.date_of_birth ? `${new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} Yrs` : '45 Yrs'}
                  </span>
                  <span className="text-[#94A3B8]">| 📱 {selectedPatient?.phone || '+8801712345678'}</span>
                </div>
              </div>
            </div>

            {/* Center Clinical Safety & Emergency Telemetry (Fills empty space on 1920px) */}
            <div className="hidden 2xl:flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 text-xs">
                <span className="font-bold text-[#92400E]">Allergy Alert:</span>
                <span className="font-semibold text-[#B45309]">Penicillin (Severe)</span>
                <span className="text-amber-400">•</span>
                <span className="font-semibold text-[#B45309]">Sulfa Drugs</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#475569] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-[#94A3B8]">Emergency:</span>
                <span className="font-semibold text-[#0F172A]">{selectedPatient?.emergency_contact_name || 'Nasreen Ahmed'}</span>
                <span className="text-[#64748B]">({selectedPatient?.emergency_contact_relation || 'Spouse'})</span>
                <span className="font-mono text-[#2563EB]">{selectedPatient?.emergency_contact_phone || '+8801712345678'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Switch Patient:
              </label>
              <select
                aria-label="Select Patient"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.patient_uid})
                  </option>
                ))}
              </select>
              <Link
                to={`/patient/timeline/${selectedPatientId}`}
                className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#1B365D] transition-colors hover:border-[#cbd5e1]"
              >
                View Full Timeline
              </Link>
            </div>
          </div>
        </Card>

        {/* Figma Two-Column Clinical Layout */}
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[560px_1fr]">
          {/* Left Column: Clinical Observations & Telemetry */}
          {/* Left Column: Clinical Observations & Telemetry */}
          <Card className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F172A]">Clinical Observations &amp; Telemetry</h3>
                <p className="mt-0.5 text-xs text-[#475569]">Capture symptoms, examination findings, and vitals matrix</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#059669]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" /> Telemetry Active
              </span>
            </div>

            {/* Chief Complaints */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Chief Complaints
                </label>
                <span className="text-[10px] font-medium text-[#94A3B8]">Primary patient symptoms</span>
              </div>
              <textarea
                rows={3}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Mild exertional chest tightness and occipital headaches for 2 weeks..."
                className="mt-1.5 w-full min-h-[80px] rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm leading-relaxed text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#EFF6FF] resize-y"
              />
            </div>

            {/* Clinical Examination & Diagnosis Notes */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Clinical Examination &amp; Diagnosis Notes
                </label>
                <span className="text-[10px] font-medium text-[#94A3B8]">Physical examination findings</span>
              </div>
              <textarea
                rows={4}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Examination findings, physical status, cardiovascular auscultation..."
                className="mt-1.5 w-full min-h-[108px] rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm leading-relaxed text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#EFF6FF] resize-y"
              />
            </div>

            {/* Vitals Capture Matrix (4x2 grid with Real-Time BMI indicator) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  Vitals Capture Matrix
                </label>
                <span className="inline-flex items-center gap-1 rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#2563EB]">
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
                    className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 transition-all hover:border-[#CBD5E1] focus-within:border-[#2563EB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#EFF6FF] focus-within:shadow-xs min-h-[76px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                        {v.label}
                      </span>
                      <span className="rounded bg-slate-200/70 px-2 py-0.5 font-mono text-[10px] font-bold text-[#475569]">
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
                        className="w-full tabular bg-transparent font-display text-xl sm:text-2xl font-bold text-[#0F172A] outline-none placeholder:text-[#CBD5E1]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-time BMI Display Badge */}
              <div className={`mt-3 flex items-center justify-between rounded-xl px-4 py-2.5 ${toneCls[bmiTone]} shadow-2xs`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Computed BMI:</span>
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
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
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
                          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                          : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#cbd5e1]'
                      }`}
                    >
                      {on && <Icon.Check size={12} className="mr-1 inline" />}
                      [{item.code}] {item.title}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-[#CBD5E1] px-3 py-2 bg-white">
                <Icon.Search size={16} className="text-[#94A3B8]" />
                <input
                  aria-label="Search or add custom ICD-10 diagnosis"
                  value={customIcd}
                  onChange={(e) => setCustomIcd(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomDiagnosis())}
                  placeholder="+ Type custom diagnosis & press Enter..."
                  className="w-full bg-transparent text-xs outline-none placeholder:text-[#94A3B8]"
                />
                {customIcd && (
                  <button
                    type="button"
                    onClick={addCustomDiagnosis}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Right Column: Structured E-Prescription Builder */}
          <Card className="space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-serif text-3xl font-bold text-[#1B365D]">℞</span>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">Electronic Prescription Formulation</h3>
                  <p className="text-xs text-[#475569]">Valid BMDC digital medication regimen</p>
                </div>
              </div>
              <Pill tone="emerald">Verified Regimen</Pill>
            </div>

            {/* Dynamic Medication Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]" aria-label="Prescription medicine table">
              <div className="grid min-w-[620px] grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_1.3fr_auto] gap-2 bg-[#F8FAFC] px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                <span>Medicine Name</span>
                <span>Dosage</span>
                <span>Frequency</span>
                <span>Duration</span>
                <span>Instructions</span>
                <span />
              </div>

              <div className="min-w-[620px] divide-y divide-[#E2E8F0]">
                {prescriptionItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_1.3fr_auto] items-center gap-2 px-3 py-2">
                    <input
                      aria-label="Medicine Name"
                      value={item.medicationName}
                      onChange={(e) => updatePrescriptionRow(item.id, 'medicationName', e.target.value)}
                      placeholder="e.g. Tab. Amlocard"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] shadow-2xs outline-none transition-all focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <input
                      aria-label="Dosage"
                      value={item.dosage}
                      onChange={(e) => updatePrescriptionRow(item.id, 'dosage', e.target.value)}
                      placeholder="5mg"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-[#0F172A] shadow-2xs outline-none transition-all focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <input
                      aria-label="Frequency"
                      value={item.frequency}
                      onChange={(e) => updatePrescriptionRow(item.id, 'frequency', e.target.value)}
                      placeholder="1+0+0"
                      className="tabular font-mono text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[#0F172A] shadow-2xs outline-none transition-all focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <input
                      aria-label="Duration"
                      value={item.duration}
                      onChange={(e) => updatePrescriptionRow(item.id, 'duration', e.target.value)}
                      placeholder="30 Days"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-[#0F172A] shadow-2xs outline-none transition-all focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <input
                      aria-label="Instructions"
                      value={item.instructions}
                      onChange={(e) => updatePrescriptionRow(item.id, 'instructions', e.target.value)}
                      placeholder="After breakfast"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-[#0F172A] shadow-2xs outline-none transition-all focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <button
                      type="button"
                      aria-label="Delete medicine row"
                      disabled={prescriptionItems.length <= 1}
                      onClick={() => removePrescriptionRow(item.id)}
                      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                        prescriptionItems.length <= 1
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626]'
                      }`}
                      title={prescriptionItems.length <= 1 ? "Prescription must contain at least one item" : "Remove medicine row"}
                    >
                      <Icon.Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Frequency Helper Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-semibold text-[#64748B]">Quick Dosage Frequency:</span>
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
                  className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1B365D] hover:bg-slate-50 hover:border-[#2563EB] transition-colors"
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
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#CBD5E1] py-2.5 text-xs font-semibold text-[#2563EB] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF]"
            >
              <Icon.Plus size={15} /> Add Medicine Row
            </button>

            {/* Lifestyle & Dietary Advice */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
                Lifestyle &amp; Dietary Advice
              </label>
              <textarea
                rows={3}
                value={rxInstructions}
                onChange={(e) => setRxInstructions(e.target.value)}
                placeholder="e.g. Low sodium diet, brisk walking 30 minutes daily, monitor BP twice weekly."
                className="mt-1.5 w-full min-h-[80px] rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm leading-relaxed text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#EFF6FF] resize-y"
              />
            </div>

            {/* Follow-up recommendation */}
            <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <span className="text-xs font-semibold text-[#475569]">Scheduled Chamber Follow-up</span>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-medium text-[#0F172A] outline-none"
              />
            </div>

            {/* Diagnostic Laboratory Requisition */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
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
                          ? 'border-[#7C3AED] bg-[#F5F3FF] text-[#7C3AED]'
                          : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#cbd5e1]'
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
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E2E8F0] bg-white/95 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8 2xl:px-12">
          <p className="flex items-center gap-2 text-xs sm:text-sm text-[#475569]">
            <Icon.Check size={16} className="text-[#059669]" />
            <span>All mandatory clinical fields verified</span>
            <span className="text-[#94A3B8]">•</span>
            <span className="inline-flex items-center gap-1 text-[#94A3B8]">
              <Icon.Clock size={14} /> Autosaved 1m ago
            </span>
          </p>

          <div className="flex w-full gap-3 sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#475569] transition-colors hover:border-[#cbd5e1] sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#16294a] active:scale-[0.98] sm:flex-none disabled:opacity-60"
            >
              {isSubmitting ? <Icon.Loader size={16} /> : <Icon.Lock size={16} />}
              <span>{isSubmitting ? 'Digitally Signing & Issuing...' : 'Finalize, Digitally Sign & Issue Prescription'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
