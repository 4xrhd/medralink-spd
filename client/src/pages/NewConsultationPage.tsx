import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { Stethoscope, User, Heart, Pill, FileText, Plus, Trash2, Check, AlertTriangle, ArrowLeft } from 'lucide-react';

const COMMON_ICD10 = [
  { code: 'I10', title: 'Essential (Primary) Hypertension' },
  { code: 'E11.9', title: 'Type 2 Diabetes Mellitus without complications' },
  { code: 'J06.9', title: 'Acute Upper Respiratory Infection, unspecified' },
  { code: 'J02.9', title: 'Acute Pharyngitis' },
  { code: 'R50.9', title: 'Fever, unspecified' },
  { code: 'K29.7', title: 'Gastritis, unspecified' },
  { code: 'M54.5', title: 'Low Back Pain' },
  { code: 'R51', title: 'Headache / Cephalea' },
];

export const NewConsultationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedPatientId = searchParams.get('patientId') || 'pat-1';
  const appointmentId = searchParams.get('appointmentId') || '';

  // Patient Info
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Clinical Consultation Inputs
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Vitals
  const [systolicBp, setSystolicBp] = useState<number | ''>('');
  const [diastolicBp, setDiastolicBp] = useState<number | ''>('');
  const [heartRate, setHeartRate] = useState<number | ''>('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [respiratoryRate, setRespiratoryRate] = useState<number | ''>('');
  const [spo2, setSpo2] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');

  // Diagnoses
  const [diagnoses, setDiagnoses] = useState<Array<{ icd10Code: string; diagnosisTitle: string; severity: string }>>([
    { icd10Code: 'I10', diagnosisTitle: 'Essential (Primary) Hypertension', severity: 'MODERATE' }
  ]);

  // Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState<Array<{
    medicationName: string;
    genericName: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
  }>>([
    {
      medicationName: 'Tab. Amlocard',
      genericName: 'Amlodipine',
      dosage: '5mg',
      frequency: '1+0+0',
      duration: '30 Days',
      route: 'Oral',
      instructions: 'After breakfast'
    }
  ]);
  const [rxInstructions, setRxInstructions] = useState('Maintain low sodium diet and regular physical activity.');

  // Lab Orders
  const [labOrders, setLabOrders] = useState<Array<{ testName: string; category: string }>>([]);
  const [newLabTest, setNewLabTest] = useState('');
  const [newLabCategory, setNewLabCategory] = useState('Biochemistry');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load patient list and selected patient
  useEffect(() => {
    const loadData = async () => {
      try {
        const pList = await api.get('/patients');
        setPatients(pList.data.data);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!selectedPatientId) return;
      try {
        const res = await api.get(`/patients/${selectedPatientId}`);
        setSelectedPatient(res.data.data);
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      }
    };
    fetchPatientDetails();
  }, [selectedPatientId]);

  // Diagnosis handlers
  const addDiagnosis = (code: string, title: string) => {
    setDiagnoses([...diagnoses, { icd10Code: code, diagnosisTitle: title, severity: 'MODERATE' }]);
  };

  const removeDiagnosis = (idx: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== idx));
  };

  // Prescription Item handlers
  const addPrescriptionRow = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicationName: '',
        genericName: '',
        dosage: '1 Tab',
        frequency: '1+0+1',
        duration: '7 Days',
        route: 'Oral',
        instructions: 'After meal'
      }
    ]);
  };

  const updatePrescriptionRow = (idx: number, field: string, value: string) => {
    const updated = [...prescriptionItems];
    (updated[idx] as any)[field] = value;
    setPrescriptionItems(updated);
  };

  const removePrescriptionRow = (idx: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  // Lab order handler
  const addLabOrder = () => {
    if (!newLabTest.trim()) return;
    setLabOrders([...labOrders, { testName: newLabTest.trim(), category: newLabCategory }]);
    setNewLabTest('');
  };

  const removeLabOrder = (idx: number) => {
    setLabOrders(labOrders.filter((_, i) => i !== idx));
  };

  // Submit consultation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          systolicBp: systolicBp || undefined,
          diastolicBp: diastolicBp || undefined,
          heartRate: heartRate || undefined,
          temperature: temperature || undefined,
          respiratoryRate: respiratoryRate || undefined,
          spo2: spo2 || undefined,
          weightKg: weightKg || undefined,
          heightCm: heightCm || undefined,
        },
        diagnoses,
        prescription: prescriptionItems.length > 0 ? {
          instructions: rxInstructions,
          validityDays: 30,
          items: prescriptionItems
        } : undefined,
        labOrders: labOrders.length > 0 ? labOrders : undefined
      };

      const res = await api.post('/consultations', payload);
      const { prescriptionId } = res.data.data;

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link to="/doctor" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Workstation
        </Link>
        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
          Clinical Consultation & E-Prescription Engine
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Patient Selection & Clinical Safety Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Select Consultation Subject (Patient)
              </h2>
            </div>
            <div className="w-full sm:w-72">
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patient_uid} — {p.full_name} ({p.blood_group || 'O+'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Patient Details & Safety Alerts */}
          {selectedPatient && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{selectedPatient.full_name}</span>
                  <span className="ml-2 font-mono text-slate-500">({selectedPatient.patient_uid})</span>
                  <span className="ml-2 text-slate-400">DOB: {selectedPatient.date_of_birth} ({selectedPatient.gender})</span>
                </div>
                <div className="text-rose-600 font-bold">
                  Blood Group: {selectedPatient.blood_group || 'O+'}
                </div>
              </div>

              {/* Allergy Warning */}
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Known Allergies / Contraindications: </strong>
                    {selectedPatient.allergies.map((a: any) => `${a.allergen} (${a.severity})`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Chief Complaint & Vitals Biometrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaints */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Chief Complaints & Examination
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaints *</label>
              <textarea
                required
                rows={3}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Fever for 3 days with dry cough and mild dyspnea on exertion..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Findings & Notes</label>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="e.g. Chest clear on auscultation, throat mildly congested..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Vitals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Vital Signs & Telemetry
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  placeholder="120"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  placeholder="80"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  placeholder="75"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Body Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  placeholder="98"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="70"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Height (cm)</label>
                <input
                  type="number"
                  placeholder="170"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Auto-Calculated BMI</span>
                <span className="text-base font-bold text-blue-700 mt-1">
                  {weightKg && heightCm ? (Number(weightKg) / Math.pow(Number(heightCm)/100, 2)).toFixed(1) : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: ICD-10 Diagnoses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              Clinical Diagnoses (ICD-10 Codified)
            </h2>
            <div className="flex flex-wrap gap-1">
              {COMMON_ICD10.slice(0, 4).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => addDiagnosis(c.code, c.title)}
                  className="text-[11px] bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 px-2.5 py-1 rounded-md font-semibold transition-colors"
                >
                  + {c.code} {c.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {diagnoses.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="bg-blue-600 text-white font-mono px-2 py-0.5 rounded font-bold">{d.icd10Code}</span>
                <input
                  type="text"
                  value={d.diagnosisTitle}
                  onChange={(e) => {
                    const u = [...diagnoses];
                    u[idx].diagnosisTitle = e.target.value;
                    setDiagnoses(u);
                  }}
                  className="flex-1 bg-transparent border-none focus:outline-none font-medium text-slate-800"
                />
                <select
                  value={d.severity}
                  onChange={(e) => {
                    const u = [...diagnoses];
                    u[idx].severity = e.target.value;
                    setDiagnoses(u);
                  }}
                  className="border border-slate-200 rounded px-2 py-1 bg-white font-semibold"
                >
                  <option value="MILD">Mild</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeDiagnosis(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Digital Prescription Builder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              Structured Digital Prescription (℞)
            </h2>
            <button
              type="button"
              onClick={addPrescriptionRow}
              className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Medication
            </button>
          </div>

          <div className="space-y-3">
            {prescriptionItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Medicine Name</label>
                  <input
                    type="text"
                    required
                    value={item.medicationName}
                    onChange={(e) => updatePrescriptionRow(idx, 'medicationName', e.target.value)}
                    placeholder="e.g. Tab. Napa Extra"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Dosage</label>
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={(e) => updatePrescriptionRow(idx, 'dosage', e.target.value)}
                    placeholder="500mg"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Frequency</label>
                  <input
                    type="text"
                    value={item.frequency}
                    onChange={(e) => updatePrescriptionRow(idx, 'frequency', e.target.value)}
                    placeholder="1+0+1"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Duration</label>
                  <input
                    type="text"
                    value={item.duration}
                    onChange={(e) => updatePrescriptionRow(idx, 'duration', e.target.value)}
                    placeholder="7 Days"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Advice</label>
                    <input
                      type="text"
                      value={item.instructions}
                      onChange={(e) => updatePrescriptionRow(idx, 'instructions', e.target.value)}
                      placeholder="After meal"
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePrescriptionRow(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">General Advice / Dietary Instructions</label>
            <textarea
              rows={2}
              value={rxInstructions}
              onChange={(e) => setRxInstructions(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        {/* Section 5: Diagnostic Lab Requisitions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Order Diagnostic Laboratory Tests (Optional)
          </h2>

          <div className="flex gap-2 text-xs">
            <input
              type="text"
              value={newLabTest}
              onChange={(e) => setNewLabTest(e.target.value)}
              placeholder="e.g. Complete Blood Count (CBC) or Fasting Lipid Profile"
              className="flex-1 p-2 border border-slate-300 rounded-lg"
            />
            <select
              value={newLabCategory}
              onChange={(e) => setNewLabCategory(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg"
            >
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Radiology">Radiology</option>
              <option value="Pathology">Pathology</option>
            </select>
            <button
              type="button"
              onClick={addLabOrder}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold"
            >
              + Order
            </button>
          </div>

          {labOrders.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {labOrders.map((lab, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 text-xs px-2.5 py-1 rounded-md font-semibold">
                  <span>{lab.testName} ({lab.category})</span>
                  <button type="button" onClick={() => removeLabOrder(idx)} className="text-purple-400 hover:text-purple-700">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Finalize Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            to="/doctor"
            className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-brand-navy hover:bg-blue-900 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-900/20 text-xs transition-all hover:scale-[1.01]"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Recording & Signing...' : 'Finalize & Digitally Sign Consultation'}
          </button>
        </div>
      </form>
    </div>
  );
};
