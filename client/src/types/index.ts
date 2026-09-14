export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  patientId?: string;
  patientUid?: string;
  doctorId?: string;
  doctorUid?: string;
  doctorProfile?: {
    bmdcLicenseNumber?: string;
    hospitalAffiliation?: string;
    specialization?: string;
    qualifications?: string;
  };
}

export interface Patient {
  id: string;
  user_id: string;
  patient_uid: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  blood_group?: string;
  address?: string;
  city?: string;
  district?: string;
  nid_or_bid?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  doctor_uid: string;
  full_name: string;
  email: string;
  phone: string;
  bmdc_license_number: string;
  specialization: string;
  qualifications: string;
  hospital_affiliation?: string;
  chamber_details?: string;
  consultation_fee: number;
  is_verified: number;
  created_at: string;
}

export interface VitalSigns {
  id?: string;
  record_id?: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  spo2?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  visit_date?: string;
}

export interface Diagnosis {
  id?: string;
  record_id?: string;
  icd10_code: string;
  diagnosis_title: string;
  description?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
}

export interface PrescriptionItem {
  id?: string;
  prescription_id?: string;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescription_uid: string;
  record_id: string;
  patient_id: string;
  doctor_id: string;
  issue_date: string;
  instructions?: string;
  validity_days: number;
  items?: PrescriptionItem[];
  doctor_name?: string;
  patient_name?: string;
  patient_uid?: string;
  specialization?: string;
}

export interface LabReport {
  id: string;
  record_id?: string;
  patient_id: string;
  test_name: string;
  category: string;
  file_path?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  test_date: string;
  results_summary?: string;
  status: 'ORDERED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  patient_uid?: string;
  patient_name?: string;
}

export interface MedicalRecord {
  id: string;
  record_uid: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint: string;
  clinical_notes?: string;
  follow_up_date?: string;
  doctor_name?: string;
  doctor_uid?: string;
  doctor_specialization?: string;
  doctor_hospital?: string;
  vitals?: VitalSigns;
  diagnoses?: Diagnosis[];
  prescription?: Prescription;
  labReports?: LabReport[];
}

export interface Allergy {
  id: string;
  patient_id: string;
  allergen: string;
  allergen_type: string;
  severity: string;
  reaction?: string;
  notes?: string;
}

export interface MedicalCondition {
  id: string;
  patient_id: string;
  condition_name: string;
  diagnosed_date?: string;
  status: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_role: string;
  action: string;
  target_resource: string;
  target_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: string;
  sha256_hash?: string;
  timestamp: string;
  actor_name?: string;
  actor_email?: string;
}

export interface Appointment {
  id: string;
  appointment_uid: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  time_slot: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  patient_name?: string;
  patient_uid?: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_specialization?: string;
}
