import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execute, initDb, queryOne } from './database.js';

export async function seedDatabase() {
  console.log('[SEED] Initializing tables...');
  await initDb();

  // Check if admin already exists
  const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', ['admin@medralink.com']);
  if (existingUser) {
    console.log('[SEED] Database already contains seed records. Skipping.');
    return;
  }

  console.log('[SEED] Generating password hashes...');
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const doctorHash = await bcrypt.hash('doctor123', salt);
  const patientHash = await bcrypt.hash('patient123', salt);

  // 1. Users
  console.log('[SEED] Inserting users...');
  const users = [
    { id: 'usr-admin-1', email: 'admin@medralink.com', hash: adminHash, role: 'ADMIN', name: 'System Administrator', phone: '+8801711000001' },
    { id: 'usr-doc-1', email: 'dr.ahmed@medralink.com', hash: doctorHash, role: 'DOCTOR', name: 'Dr. Ahmed Tariq', phone: '+8801711000002' },
    { id: 'usr-doc-2', email: 'dr.farzana@medralink.com', hash: doctorHash, role: 'DOCTOR', name: 'Dr. Farzana Rahman', phone: '+8801711000003' },
    { id: 'usr-pat-1', email: 'rahim@gmail.com', hash: patientHash, role: 'PATIENT', name: 'Rahim Ahmed', phone: '+8801811000001' },
    { id: 'usr-pat-2', email: 'sara@gmail.com', hash: patientHash, role: 'PATIENT', name: 'Sara Akter', phone: '+8801811000002' },
    { id: 'usr-pat-3', email: 'karim@gmail.com', hash: patientHash, role: 'PATIENT', name: 'Karim Hasan', phone: '+8801811000003' },
  ];

  for (const u of users) {
    await execute(
      'INSERT INTO users (id, email, password_hash, role, full_name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.id, u.email, u.hash, u.role, u.name, u.phone, 'ACTIVE']
    );
  }

  // 2. Doctors
  console.log('[SEED] Inserting doctors...');
  await execute(
    `INSERT INTO doctors (id, user_id, doctor_uid, bmdc_license_number, specialization, qualifications, hospital_affiliation, chamber_details, consultation_fee, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['doc-1', 'usr-doc-1', 'DOC-2001', 'BMDC-A-54921', 'Cardiology & Internal Medicine', 'MBBS, FCPS (Cardiology), MD (BSMMU)', 'National Institute of Cardiovascular Diseases (NICVD)', 'Square Hospital, Room 402, Panthapath, Dhaka', 1000.0, 1]
  );

  await execute(
    `INSERT INTO doctors (id, user_id, doctor_uid, bmdc_license_number, specialization, qualifications, hospital_affiliation, chamber_details, consultation_fee, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['doc-2', 'usr-doc-2', 'DOC-2002', 'BMDC-A-68210', 'General & Preventive Medicine', 'MBBS, MRCP (UK), FCGP', 'Dhaka Medical College & Hospital', 'Labaid Specialized Hospital, Dhanmondi, Dhaka', 800.0, 1]
  );

  // 3. Patients
  console.log('[SEED] Inserting patients...');
  await execute(
    `INSERT INTO patients (id, user_id, patient_uid, date_of_birth, gender, blood_group, address, city, district, nid_or_bid, emergency_contact_name, emergency_contact_phone, emergency_contact_relation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pat-1', 'usr-pat-1', 'P-1001', '1981-05-14', 'MALE', 'O+', 'House 42, Road 11, Banani', 'Dhaka', 'Dhaka', '19812691234567890', 'Nasreen Ahmed', '+8801712345678', 'Spouse']
  );

  await execute(
    `INSERT INTO patients (id, user_id, patient_uid, date_of_birth, gender, blood_group, address, city, district, nid_or_bid, emergency_contact_name, emergency_contact_phone, emergency_contact_relation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pat-2', 'usr-pat-2', 'P-1002', '1994-09-22', 'FEMALE', 'B+', 'Plot 18, Block D, Mirpur-12', 'Dhaka', 'Dhaka', '19942699876543210', 'Rafiqul Islam', '+8801912345678', 'Brother']
  );

  await execute(
    `INSERT INTO patients (id, user_id, patient_uid, date_of_birth, gender, blood_group, address, city, district, nid_or_bid, emergency_contact_name, emergency_contact_phone, emergency_contact_relation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pat-3', 'usr-pat-3', 'P-1003', '1968-12-03', 'MALE', 'A+', 'Sector 7, Road 4, Uttara', 'Dhaka', 'Dhaka', '19682691122334455', 'Farhana Hasan', '+8801612345678', 'Daughter']
  );

  // 4. Allergies & Medical Conditions
  console.log('[SEED] Inserting patient conditions & allergies...');
  await execute(
    `INSERT INTO allergies (id, patient_id, allergen, allergen_type, severity, reaction, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['alg-1', 'pat-1', 'Penicillin', 'DRUG', 'SEVERE', 'Urticaria, Angioedema', 'Anaphylactoid reaction noted in 2018']
  );

  await execute(
    `INSERT INTO allergies (id, patient_id, allergen, allergen_type, severity, reaction, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['alg-2', 'pat-3', 'Sulfa Drugs / Bactrim', 'DRUG', 'MODERATE', 'Skin Rash, Pruritus', 'Avoid cotrimoxazole formulations']
  );

  await execute(
    `INSERT INTO medical_conditions (id, patient_id, condition_name, diagnosed_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['mc-1', 'pat-1', 'Essential Hypertension', '2021-03-10', 'MANAGED', 'On daily ARB medication']
  );

  await execute(
    `INSERT INTO medical_conditions (id, patient_id, condition_name, diagnosed_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['mc-2', 'pat-2', 'Type 2 Diabetes Mellitus', '2023-01-15', 'ACTIVE', 'HbA1c monitored quarterly']
  );

  // 5. Appointments
  console.log('[SEED] Inserting appointments...');
  await execute(
    `INSERT INTO appointments (id, appointment_uid, patient_id, doctor_id, appointment_date, time_slot, status, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['apt-1', 'APT-801', 'pat-1', 'doc-1', '2026-08-10', '10:00 AM', 'COMPLETED', 'Routine Cardiovascular Review & Blood Pressure check']
  );

  await execute(
    `INSERT INTO appointments (id, appointment_uid, patient_id, doctor_id, appointment_date, time_slot, status, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['apt-2', 'APT-802', 'pat-2', 'doc-2', '2026-08-12', '11:30 AM', 'COMPLETED', 'Fever, cough, and elevated fasting glucose review']
  );

  await execute(
    `INSERT INTO appointments (id, appointment_uid, patient_id, doctor_id, appointment_date, time_slot, status, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['apt-3', 'APT-803', 'pat-1', 'doc-1', '2026-09-18', '05:00 PM', 'SCHEDULED', 'Follow-up consultation after 1 month']
  );

  // 6. Clinical Consultations / Medical Records
  console.log('[SEED] Inserting medical records & vitals...');
  // Visit 1 for Rahim Ahmed (pat-1)
  await execute(
    `INSERT INTO medical_records (id, record_uid, patient_id, doctor_id, appointment_id, visit_date, chief_complaint, clinical_notes, follow_up_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rec-1', 'REC-94821', 'pat-1', 'doc-1', 'apt-1', '2026-08-10 10:30:00', 'Mild exertional chest tightness and morning occipital headaches for 2 weeks', 'Patient is moderately anxious. Heart sounds S1, S2 audible with no murmurs. Chest clear on auscultation.', '2026-09-18']
  );

  await execute(
    `INSERT INTO vital_signs (id, record_id, systolic_bp, diastolic_bp, heart_rate, temperature, respiratory_rate, spo2, weight_kg, height_cm, bmi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['vit-1', 'rec-1', 145, 92, 78, 36.8, 18, 98, 76.5, 172.0, 25.9]
  );

  await execute(
    `INSERT INTO diagnoses (id, record_id, icd10_code, diagnosis_title, description, severity, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['dia-1', 'rec-1', 'I10', 'Essential (Primary) Hypertension', 'Uncontrolled stage 1 hypertension with tension-type cephalea', 'MODERATE', 'ACTIVE']
  );

  // Prescription for Visit 1
  await execute(
    `INSERT INTO prescriptions (id, prescription_uid, record_id, patient_id, doctor_id, issue_date, instructions, validity_days)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rx-1', 'RX-4029', 'rec-1', 'pat-1', 'doc-1', '2026-08-10 10:45:00', 'Reduce dietary salt. Maintain 30 minutes brisk walking 5 days a week. Check BP twice weekly.', 30]
  );

  await execute(
    `INSERT INTO prescription_items (id, prescription_id, medication_name, generic_name, dosage, frequency, duration, route, instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rxi-1', 'rx-1', 'Amlocard 5mg', 'Amlodipine Besylate', '5mg', '1+0+0 (Morning)', '30 Days', 'Oral', 'After breakfast']
  );
  await execute(
    `INSERT INTO prescription_items (id, prescription_id, medication_name, generic_name, dosage, frequency, duration, route, instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rxi-2', 'rx-1', 'Napa Extra', 'Paracetamol 500mg + Caffeine 65mg', '565mg', '1+0+1 (If headache)', '5 Days', 'Oral', 'After meal when required']
  );

  // Lab Report for Visit 1
  await execute(
    `INSERT INTO lab_reports (id, record_id, patient_id, test_name, category, test_date, results_summary, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lab-1', 'rec-1', 'pat-1', 'Lipid Profile & Serum Creatinine', 'Biochemistry', '2026-08-11', 'Total Cholesterol: 218 mg/dL (Borderline High), Serum Creatinine: 0.9 mg/dL (Normal)', 'COMPLETED']
  );

  // Visit 2 for Sara Akter (pat-2)
  await execute(
    `INSERT INTO medical_records (id, record_uid, patient_id, doctor_id, appointment_id, visit_date, chief_complaint, clinical_notes, follow_up_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rec-2', 'REC-94822', 'pat-2', 'doc-2', 'apt-2', '2026-08-12 11:45:00', 'Persistent dry cough, fatigue, and polydipsia for 10 days', 'Throat mildly erythematous. Lungs clear. Advised hydration and glycemic control review.', '2026-08-26']
  );

  await execute(
    `INSERT INTO vital_signs (id, record_id, systolic_bp, diastolic_bp, heart_rate, temperature, respiratory_rate, spo2, weight_kg, height_cm, bmi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['vit-2', 'rec-2', 120, 80, 82, 37.5, 20, 99, 62.0, 160.0, 24.2]
  );

  await execute(
    `INSERT INTO diagnoses (id, record_id, icd10_code, diagnosis_title, description, severity, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['dia-2', 'rec-2', 'E11.9', 'Type 2 Diabetes Mellitus without complications', 'Mild hyperglycemic decompensation secondary to viral upper respiratory tract infection', 'MODERATE', 'ACTIVE']
  );

  await execute(
    `INSERT INTO prescriptions (id, prescription_uid, record_id, patient_id, doctor_id, issue_date, instructions, validity_days)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rx-2', 'RX-4030', 'rec-2', 'pat-2', 'doc-2', '2026-08-12 12:00:00', 'Avoid sugary beverages. Warm saline gargle 3 times daily. Monitor fasting sugar.', 14]
  );

  await execute(
    `INSERT INTO prescription_items (id, prescription_id, medication_name, generic_name, dosage, frequency, duration, route, instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rxi-3', 'rx-2', 'Comet 500mg', 'Metformin Hydrochloride', '500mg', '1+0+1 (Morning + Night)', '14 Days', 'Oral', 'Immediately with meals']
  );
  await execute(
    `INSERT INTO prescription_items (id, prescription_id, medication_name, generic_name, dosage, frequency, duration, route, instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['rxi-4', 'rx-2', 'Fexo 120mg', 'Fexofenadine HCl', '120mg', '0+0+1 (Night)', '7 Days', 'Oral', 'Before sleep']
  );

  await execute(
    `INSERT INTO lab_reports (id, record_id, patient_id, test_name, category, test_date, results_summary, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lab-2', 'rec-2', 'pat-2', 'HbA1c & Fasting Blood Sugar (FBS)', 'Biochemistry', '2026-08-13', 'HbA1c: 7.2% (Moderate control), FBS: 8.1 mmol/L', 'COMPLETED']
  );

  // 7. Initial Audit Trail
  console.log('[SEED] Inserting initial audit logs...');
  const auditEntries = [
    { actor: 'usr-admin-1', role: 'ADMIN', action: 'SYSTEM_BOOTSTRAP', resource: 'platform', id: 'system', details: 'Initialized MedraLink 3NF database schema and verified clinical models' },
    { actor: 'usr-doc-1', role: 'DOCTOR', action: 'CONSULTATION_CREATED', resource: 'medical_records', id: 'rec-1', details: 'Recorded consultation and issued RX-4029 for patient Rahim Ahmed (P-1001)' },
    { actor: 'usr-doc-2', role: 'DOCTOR', action: 'CONSULTATION_CREATED', resource: 'medical_records', id: 'rec-2', details: 'Recorded consultation and issued RX-4030 for patient Sara Akter (P-1002)' },
  ];

  for (const a of auditEntries) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(a) + Date.now()).digest('hex');
    await execute(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_resource, target_id, ip_address, user_agent, details, sha256_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['aud-' + Math.random().toString(36).substring(2, 9), a.actor, a.role, a.action, a.resource, a.id, '127.0.0.1', 'MedraLink-CLI/1.0', a.details, hash]
    );
  }

  console.log('[SEED] Database seeding completed successfully! ✨');
}

if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Error during seeding:', err);
      process.exit(1);
    });
}
