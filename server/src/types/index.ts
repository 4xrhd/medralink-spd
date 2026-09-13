export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  phone: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  patient_uid: string;
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
  // joined fields
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  doctor_uid: string;
  bmdc_license_number: string;
  specialization: string;
  qualifications: string;
  hospital_affiliation?: string;
  chamber_details?: string;
  consultation_fee: number;
  is_verified: number;
  created_at: string;
  // joined fields
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface VitalSigns {
  id: string;
  record_id: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  spo2?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  created_at: string;
}

export interface Diagnosis {
  id: string;
  record_id: string;
  icd10_code: string;
  diagnosis_title: string;
  description?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
  diagnosed_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
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
  created_at: string;
  items?: PrescriptionItem[];
  doctor_name?: string;
  patient_name?: string;
}

export interface MedicalRecord {
  id: string;
  record_uid: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: string;
  chief_complaint: string;
  clinical_notes?: string;
  follow_up_date?: string;
  created_at: string;
  doctor_name?: string;
  doctor_specialization?: string;
  doctor_hospital?: string;
  vitals?: VitalSigns;
  diagnoses?: Diagnosis[];
  prescription?: Prescription;
  lab_reports?: LabReport[];
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
  created_at: string;
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
  created_at: string;
  patient_name?: string;
  doctor_name?: string;
  doctor_specialization?: string;
}
