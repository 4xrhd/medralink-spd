import { Request, Response } from 'express';
import { execute, query, queryOne } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';
import { Patient } from '../types/index.js';

export async function searchPatients(req: Request, res: Response) {
  try {
    const q = (req.query.q as string || '').trim();
    let sql = `
      SELECT p.*, u.full_name, u.email, u.phone
      FROM patients p
      JOIN users u ON p.user_id = u.id
    `;
    const params: any[] = [];

    if (q) {
      sql += ` WHERE p.patient_uid LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ? OR p.nid_or_bid LIKE ?`;
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
    if (req.user?.role === 'PATIENT' && req.user.patientId !== patient.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only view your own patient profile.' });
    }

    // Fetch allergies and conditions
    const allergies = await query('SELECT * FROM allergies WHERE patient_id = ?', [patient.id]);
    const conditions = await query('SELECT * FROM medical_conditions WHERE patient_id = ?', [patient.id]);

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
    if (req.user?.role === 'PATIENT' && req.user.patientId !== patient.id) {
      return res.status(403).json({ success: false, message: 'Access denied to another patient\'s medical history.' });
    }

    // Retrieve all clinical consultation records chronologically (newest first)
    const records = await query(
      `SELECT r.*, d.doctor_uid, u.full_name as doctor_name, d.specialization as doctor_specialization, d.hospital_affiliation as doctor_hospital
       FROM medical_records r
       JOIN doctors d ON r.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE r.patient_id = ?
       ORDER BY r.visit_date DESC`,
      [patient.id]
    );

    // Hydrate each record with vitals, diagnoses, prescription items, and lab attachments
    const populatedTimeline = await Promise.all(
      records.map(async (record: any) => {
        const vitals = await queryOne('SELECT * FROM vital_signs WHERE record_id = ?', [record.id]);
        const diagnoses = await query('SELECT * FROM diagnoses WHERE record_id = ?', [record.id]);

        const prescription = await queryOne(
          'SELECT * FROM prescriptions WHERE record_id = ?',
          [record.id]
        );

        let prescriptionItems: any[] = [];
        if (prescription) {
          prescriptionItems = await query(
            'SELECT * FROM prescription_items WHERE prescription_id = ?',
            [prescription.id]
          );
        }

        const labReports = await query(
          'SELECT * FROM lab_reports WHERE record_id = ? OR (patient_id = ? AND test_date = ?)',
          [record.id, patient.id, record.visit_date.split(' ')[0]]
        );

        return {
          ...record,
          vitals,
          diagnoses,
          prescription: prescription ? { ...prescription, items: prescriptionItems } : null,
          labReports
        };
      })
    );

    const allergies = await query('SELECT * FROM allergies WHERE patient_id = ?', [patient.id]);
    const conditions = await query('SELECT * FROM medical_conditions WHERE patient_id = ?', [patient.id]);

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
