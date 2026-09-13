import { Request, Response } from 'express';
import { execute, query, queryOne, runTransaction } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';

export async function createConsultation(req: Request, res: Response) {
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only authorized doctors can create clinical consultations.' });
    }

    const {
      patientId,
      appointmentId,
      chiefComplaint,
      clinicalNotes,
      followUpDate,
      vitals,
      diagnoses,
      prescription,
      labOrders
    } = req.body;

    if (!patientId || !chiefComplaint) {
      return res.status(400).json({ success: false, message: 'Patient ID and Chief Complaint are required.' });
    }

    // Verify patient exists
    const patient = await queryOne('SELECT id, patient_uid FROM patients WHERE id = ? OR patient_uid = ?', [patientId, patientId]);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Resolve doctor record
    const resolvedDoctorId = doctorId || (req.body.doctorId ? req.body.doctorId : null);
    if (!resolvedDoctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required.' });
    }

    const recordId = 'rec-' + Math.random().toString(36).substring(2, 10);
    const recordUid = 'REC-' + Math.floor(10000 + Math.random() * 90000);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let prescriptionId: string | null = null;
    let prescriptionUid: string | null = null;

    // Execute atomic transaction
    await runTransaction(async () => {
      // 1. Insert Medical Record
      await execute(
        `INSERT INTO medical_records (id, record_uid, patient_id, doctor_id, appointment_id, visit_date, chief_complaint, clinical_notes, follow_up_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [recordId, recordUid, patient.id, resolvedDoctorId, appointmentId || null, now, chiefComplaint, clinicalNotes || '', followUpDate || null]
      );

      // 2. Insert Vital Signs (if provided)
      if (vitals && Object.keys(vitals).length > 0) {
        const vitalsId = 'vit-' + Math.random().toString(36).substring(2, 10);
        let bmi: number | null = null;
        if (vitals.weightKg && vitals.heightCm) {
          const heightM = vitals.heightCm / 100;
          bmi = Number((vitals.weightKg / (heightM * heightM)).toFixed(1));
        }

        await execute(
          `INSERT INTO vital_signs (id, record_id, systolic_bp, diastolic_bp, heart_rate, temperature, respiratory_rate, spo2, weight_kg, height_cm, bmi)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            vitalsId,
            recordId,
            vitals.systolicBp || null,
            vitals.diastolicBp || null,
            vitals.heartRate || null,
            vitals.temperature || null,
            vitals.respiratoryRate || null,
            vitals.spo2 || null,
            vitals.weightKg || null,
            vitals.heightCm || null,
            bmi
          ]
        );
      }

      // 3. Insert Diagnoses
      if (Array.isArray(diagnoses) && diagnoses.length > 0) {
        for (const diag of diagnoses) {
          const diagId = 'dia-' + Math.random().toString(36).substring(2, 10);
          await execute(
            `INSERT INTO diagnoses (id, record_id, icd10_code, diagnosis_title, description, severity, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              diagId,
              recordId,
              diag.icd10Code || 'R69',
              diag.diagnosisTitle || 'Unspecified illness',
              diag.description || '',
              diag.severity || 'MODERATE',
              diag.status || 'ACTIVE'
            ]
          );
        }
      }

      // 4. Insert Prescription & Items
      if (prescription && prescription.items && prescription.items.length > 0) {
        prescriptionId = 'rx-' + Math.random().toString(36).substring(2, 10);
        prescriptionUid = 'RX-' + Math.floor(1000 + Math.random() * 9000);

        await execute(
          `INSERT INTO prescriptions (id, prescription_uid, record_id, patient_id, doctor_id, issue_date, instructions, validity_days)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            prescriptionId,
            prescriptionUid,
            recordId,
            patient.id,
            resolvedDoctorId,
            now,
            prescription.instructions || '',
            prescription.validityDays || 30
          ]
        );

        for (const item of prescription.items) {
          const itemId = 'rxi-' + Math.random().toString(36).substring(2, 10);
          await execute(
            `INSERT INTO prescription_items (id, prescription_id, medication_name, generic_name, dosage, frequency, duration, route, instructions)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              prescriptionId,
              item.medicationName,
              item.genericName || '',
              item.dosage,
              item.frequency,
              item.duration,
              item.route || 'Oral',
              item.instructions || ''
            ]
          );
        }
      }

      // 5. Insert Ordered Lab Tests
      if (Array.isArray(labOrders) && labOrders.length > 0) {
        for (const lab of labOrders) {
          const labId = 'lab-' + Math.random().toString(36).substring(2, 10);
          await execute(
            `INSERT INTO lab_reports (id, record_id, patient_id, test_name, category, test_date, results_summary, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              labId,
              recordId,
              patient.id,
              lab.testName,
              lab.category || 'General Diagnostics',
              now.split(' ')[0],
              lab.instructions || 'Ordered by physician',
              'ORDERED'
            ]
          );
        }
      }

      // 6. Complete appointment if linked
      if (appointmentId) {
        await execute(
          'UPDATE appointments SET status = ? WHERE id = ?',
          ['COMPLETED', appointmentId]
        );
      }

      // 7. Record immutable audit log
      await recordAuditEvent({
        actorId: req.user?.id,
        actorRole: req.user?.role || 'DOCTOR',
        action: 'CONSULTATION_CREATED',
        targetResource: 'medical_records',
        targetId: recordId,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'],
        details: `Recorded clinical consultation ${recordUid} with prescription ${prescriptionUid || 'NONE'} for patient ${patient.patient_uid}`
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Consultation recorded successfully.',
      data: {
        recordId,
        recordUid,
        prescriptionId,
        prescriptionUid,
        pdfDownloadUrl: prescriptionId ? `/api/v1/prescriptions/${prescriptionId}/pdf` : null
      }
    });
  } catch (error: any) {
    console.error('Error creating consultation:', error);
    return res.status(500).json({ success: false, message: 'Failed to record consultation.' });
  }
}

export async function getConsultationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const record = await queryOne(
      `SELECT r.*, d.doctor_uid, u.full_name as doctor_name, d.specialization as doctor_specialization,
              p.patient_uid, pu.full_name as patient_name
       FROM medical_records r
       JOIN doctors d ON r.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       JOIN patients p ON r.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       WHERE r.id = ? OR r.record_uid = ?`,
      [id, id]
    );

    if (!record) {
      return res.status(404).json({ success: false, message: 'Consultation record not found.' });
    }

    // Role-level security check
    if (req.user?.role === 'PATIENT' && req.user.patientId !== record.patient_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const vitals = await queryOne('SELECT * FROM vital_signs WHERE record_id = ?', [record.id]);
    const diagnoses = await query('SELECT * FROM diagnoses WHERE record_id = ?', [record.id]);
    const prescription = await queryOne('SELECT * FROM prescriptions WHERE record_id = ?', [record.id]);
    let prescriptionItems: any[] = [];
    if (prescription) {
      prescriptionItems = await query('SELECT * FROM prescription_items WHERE prescription_id = ?', [prescription.id]);
    }
    const labReports = await query('SELECT * FROM lab_reports WHERE record_id = ?', [record.id]);

    return res.json({
      success: true,
      data: {
        ...record,
        vitals,
        diagnoses,
        prescription: prescription ? { ...prescription, items: prescriptionItems } : null,
        labReports
      }
    });
  } catch (error: any) {
    console.error('Error fetching consultation:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve consultation.' });
  }
}
