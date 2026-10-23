-- Hardening pass: audit chain position column and indexes for the RBAC link checks.
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS seq BIGINT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_seq ON public.audit_logs(seq);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_patient ON public.appointments(doctor_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_records_doctor_patient ON public.medical_records(doctor_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_rx ON public.prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_vitals_record ON public.vital_signs(record_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_record ON public.diagnoses(record_id);
CREATE INDEX IF NOT EXISTS idx_allergies_patient ON public.allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_patient ON public.medical_conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token_hash);
