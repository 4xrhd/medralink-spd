import { Request, Response } from 'express';
import { execute, query, queryOne } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';
import { canAccessPatient } from '../services/accessService.js';
import { Patient } from '../types/index.js';

export async function searchPatients(req: Request, res: Response) {
  try {
    const q = (req.query.q as string || '').trim();
    // Doctors need the directory to start a first consultation, but not national IDs or addresses
    const columns = req.user?.role === 'DOCTOR'
      ? 'p.id, p.patient_uid, p.date_of_birth, p.gender, p.blood_group, p.created_at, u.full_name, u.phone'
      : 'p.*, u.full_name, u.email, u.phone';
    let sql = `
      SELECT ${columns}
      FROM patients p
      JOIN users u ON p.user_id = u.id
    `;
    const params: any[] = [];

    if (q) {
      sql += ` WHERE LOWER(p.patient_uid) LIKE LOWER(?) OR LOWER(u.full_name) LIKE LOWER(?) OR u.phone LIKE ? OR p.nid_or_bid LIKE ?`;
      const searchPattern = `%${q}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY p.created_at DESC LIMIT 50`;
    const patients = await query<Patient>(sql, params);

    return res.json({ success: true, data: patients });
  } catch (error: any) {
    console.error('Error searching patients:', error);
    return res.status(500).json({ success: false, message: 'Failed to search patients.' });
  }
}

export async function getPatientById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const patient = await queryOne<Patient>(
      `SELECT p.*, u.full_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? OR p.patient_uid = ?`,
      [id, id]
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Role-level security check: If patient role, ensure they only view their own profile
    if (!(await canAccessPatient(req, patient.id))) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only view your own patient profile.' });
    }

    // Fetch allergies and conditions
    const allergies = await query('SELECT * FROM allergies WHERE patient_id = ?', [patient.id]);
    const conditions = await query('SELECT * FROM medical_conditions WHERE patient_id = ?', [patient.id]);

    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'UNKNOWN',
      action: 'VIEW_PATIENT',
      targetResource: 'patients',
      targetId: patient.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Patient profile ${patient.patient_uid} viewed`
    });

    return res.json({
      success: true,
      data: {
        ...patient,
        allergies,
        conditions
      }
    });
  } catch (error: any) {
    console.error('Error fetching patient:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve patient profile.' });
  }
}

export async function getPatientTimeline(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Resolve patient by ID or UID
    const patient = await queryOne<Patient>(
      `SELECT p.*, u.full_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? OR p.patient_uid = ?`,
      [id, id]
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Data isolation check: Patients can only view their own timeline
    if (!(await canAccessPatient(req, patient.id))) {
      return res.status(403).json({ success: false, message: 'Access denied to another patient\'s medical history.' });
    }

    // One query per table for the whole patient, run in parallel, instead of
    // several queries per visit (N+1). Matters on a remote database such as Supabase.
    const [records, vitals, diagnoses, prescriptions, prescriptionItems, labReports, allergies, conditions] =
      await Promise.all([
        query(
          `SELECT r.*, d.doctor_uid, u.full_name as doctor_name, d.specialization as doctor_specialization, d.hospital_affiliation as doctor_hospital
           FROM medical_records r
           JOIN doctors d ON r.doctor_id = d.id
           JOIN users u ON d.user_id = u.id
           WHERE r.patient_id = ?
           ORDER BY r.visit_date DESC`,
          [patient.id]
        ),
        query(
          `SELECT v.* FROM vital_signs v JOIN medical_records r ON v.record_id = r.id WHERE r.patient_id = ?`,
          [patient.id]
        ),
        query(
          `SELECT dg.* FROM diagnoses dg JOIN medical_records r ON dg.record_id = r.id WHERE r.patient_id = ?`,
          [patient.id]
        ),
        query('SELECT * FROM prescriptions WHERE patient_id = ?', [patient.id]),
        query(
          `SELECT pi.* FROM prescription_items pi JOIN prescriptions pr ON pi.prescription_id = pr.id WHERE pr.patient_id = ?`,
          [patient.id]
        ),
        query('SELECT * FROM lab_reports WHERE patient_id = ?', [patient.id]),
        query('SELECT * FROM allergies WHERE patient_id = ?', [patient.id]),
        query('SELECT * FROM medical_conditions WHERE patient_id = ?', [patient.id]),
      ]);

    const populatedTimeline = records.map((record: any) => {
      const prescription = prescriptions.find((p: any) => p.record_id === record.id);
      const visitDay = String(record.visit_date).split(' ')[0];
      return {
        ...record,
        vitals: vitals.find((v: any) => v.record_id === record.id) ?? null,
        diagnoses: diagnoses.filter((d: any) => d.record_id === record.id),
        prescription: prescription
          ? { ...prescription, items: prescriptionItems.filter((i: any) => i.prescription_id === prescription.id) }
          : null,
        // Reports attached to this visit, or taken on the same day
        labReports: labReports.filter((l: any) => l.record_id === record.id || l.test_date === visitDay),
      };
    });

    // Record audit event
    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'UNKNOWN',
      action: 'TIMELINE_ACCESSED',
      targetResource: 'patients',
      targetId: patient.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Longitudinal timeline retrieved for patient ${patient.patient_uid} (${patient.full_name})`
    });

    return res.json({
      success: true,
      data: {
        patient,
        allergies,
        conditions,
        timeline: populatedTimeline
      }
    });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve medical timeline.' });
  }
}
