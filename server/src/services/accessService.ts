import { Request } from 'express';
import { queryOne } from '../db/database.js';
import { recordAuditEvent } from './auditService.js';
import { getBooleanSetting } from './settingsService.js';

/**
 * A doctor is "assigned" to a patient once an appointment or a medical record links them.
 * Creating a consultation or booking an appointment therefore establishes the assignment.
 */
export async function canDoctorAccessPatient(doctorId: string, patientId: string): Promise<boolean> {
  const link = await queryOne<{ found: number }>(
    `SELECT 1 AS found FROM appointments WHERE doctor_id = ? AND patient_id = ?
     UNION
     SELECT 1 AS found FROM medical_records WHERE doctor_id = ? AND patient_id = ?
     LIMIT 1`,
    [doctorId, patientId, doctorId, patientId]
  );
  return Boolean(link);
}

/**
 * Whether a doctor may record consultations and issue prescriptions. When the admin setting
 * require_doctor_verification is on, the doctor must be accredited and the account active.
 */
export async function isDoctorCleared(doctorId: string): Promise<boolean> {
  const doctor = await queryOne<{ is_verified: number; status: string }>(
    'SELECT d.is_verified, u.status FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?',
    [doctorId]
  );
  if (!doctor || doctor.status !== 'ACTIVE') return false;
  if (!(await getBooleanSetting('require_doctor_verification'))) return true;
  return Boolean(doctor.is_verified);
}

/**
 * Central record-level authorization for patient data.
 * ADMIN: all patients. PATIENT: only self. DOCTOR: only assigned patients.
 * Refusals are written to the audit trail as ACCESS_DENIED.
 */
export async function canAccessPatient(req: Request, patientId: string): Promise<boolean> {
  const user = req.user;
  if (!user) return false;

  let allowed = false;
  if (user.role === 'ADMIN') {
    allowed = true;
  } else if (user.role === 'PATIENT') {
    allowed = user.patientId === patientId;
  } else if (user.role === 'DOCTOR' && user.doctorId) {
    allowed = await canDoctorAccessPatient(user.doctorId, patientId);
  }

  if (!allowed) {
    await recordAuditEvent({
      actorId: user.id,
      actorRole: user.role,
      action: 'ACCESS_DENIED',
      targetResource: 'patients',
      targetId: patientId,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `${user.role} ${user.email} denied access to ${req.method} ${req.originalUrl}`,
    });
  }
  return allowed;
}
