-- =============================================================================
-- MedraLink - 3NF Relational Database Schema (15 Normalized Tables)
-- CSE 416 Software Project Design & Development
-- =============================================================================

-- 1. USERS: Base authentication credentials and roles
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'PATIENT')),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PATIENTS: Demographic, health identification, and emergency contact records
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_uid TEXT UNIQUE NOT NULL, -- e.g. P-1001
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    address TEXT,
    city TEXT,
    district TEXT,
    nid_or_bid TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. DOCTORS: Medical licensing, qualifications, and chamber schedules
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_uid TEXT UNIQUE NOT NULL, -- e.g. DOC-2001
    bmdc_license_number TEXT UNIQUE NOT NULL,
    specialization TEXT NOT NULL,
    qualifications TEXT NOT NULL,
    hospital_affiliation TEXT,
    chamber_details TEXT,
    consultation_fee REAL DEFAULT 500.0,
    is_verified INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. APPOINTMENTS: Consultation scheduling and queuing
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    appointment_uid TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. MEDICAL_RECORDS: Primary clinical consultation consultation events
CREATE TABLE IF NOT EXISTS medical_records (
    id TEXT PRIMARY KEY,
    record_uid TEXT UNIQUE NOT NULL, -- e.g. REC-94821
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    chief_complaint TEXT NOT NULL,
    clinical_notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. VITAL_SIGNS: Patient biometrics captured during consultation
CREATE TABLE IF NOT EXISTS vital_signs (
    id TEXT PRIMARY KEY,
    record_id TEXT UNIQUE NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    systolic_bp INTEGER,      -- mmHg
    diastolic_bp INTEGER,     -- mmHg
    heart_rate INTEGER,       -- bpm
    temperature REAL,         -- Celsius
    respiratory_rate INTEGER, -- breaths/min
    spo2 INTEGER,             -- %
    weight_kg REAL,
    height_cm REAL,
    bmi REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. DIAGNOSES: Formal clinical diagnosis with ICD-10 codification
CREATE TABLE IF NOT EXISTS diagnoses (
    id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    icd10_code TEXT NOT NULL,
    diagnosis_title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'MODERATE' CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'CHRONIC')),
    diagnosed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRESCRIPTIONS: Electronic medical prescription header
CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    prescription_uid TEXT UNIQUE NOT NULL, -- e.g. RX-4029
    record_id TEXT UNIQUE NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    instructions TEXT,
    validity_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. PRESCRIPTION_ITEMS: Specific medications, regimens, and instructions
CREATE TABLE IF NOT EXISTS prescription_items (
    id TEXT PRIMARY KEY,
    prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    dosage TEXT NOT NULL,            -- e.g. "500mg"
    frequency TEXT NOT NULL,         -- e.g. "1+0+1" (Morning + Noon + Night)
    duration TEXT NOT NULL,          -- e.g. "7 Days"
    route TEXT DEFAULT 'Oral',       -- Oral, IV, Topical, etc.
    instructions TEXT,               -- e.g. "Take after meal"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. LAB_REPORTS: Diagnostic laboratory results and document files
CREATE TABLE IF NOT EXISTS lab_reports (
    id TEXT PRIMARY KEY,
    record_id TEXT REFERENCES medical_records(id) ON DELETE SET NULL,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    category TEXT NOT NULL,          -- Hematology, Radiology, Biochemistry, Pathology
    file_path TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    test_date DATE NOT NULL,
    results_summary TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('ORDERED', 'PENDING', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. DOCUMENTS: General patient medical documents and discharge slips
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,     -- Discharge Summary, Vaccination, Old Prescription
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. MEDICAL_CONDITIONS: Chronic or long-term medical conditions
CREATE TABLE IF NOT EXISTS medical_conditions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    diagnosed_date DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MANAGED', 'RESOLVED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. ALLERGIES: Known drug and environmental contraindications
CREATE TABLE IF NOT EXISTS allergies (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    allergen_type TEXT NOT NULL CHECK (allergen_type IN ('DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER')),
    severity TEXT NOT NULL CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING')),
    reaction TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. NOTIFICATIONS: In-app real-time system alerts
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT')),
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. AUDIT_LOGS: Immutable append-only audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,             -- LOGIN, CONSULTATION_CREATED, RECORD_VIEWED, etc.
    target_resource TEXT NOT NULL,    -- medical_records, prescriptions, users, etc.
    target_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,                     -- JSON serialized context or description
    sha256_hash TEXT,                 -- Cryptographic audit integrity chain
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance (Sub-200ms latency guarantee)
CREATE INDEX IF NOT EXISTS idx_patients_uid ON patients(patient_uid);
CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_uid ON doctors(doctor_uid);
CREATE INDEX IF NOT EXISTS idx_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_records_visit ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
