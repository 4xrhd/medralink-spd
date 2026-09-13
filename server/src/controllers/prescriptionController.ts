import { Request, Response } from 'express';
import { query, queryOne } from '../db/database.js';
import { generatePrescriptionPDF } from '../services/pdfService.js';
import { recordAuditEvent } from '../services/auditService.js';

export async function getPrescriptionById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const prescription = await queryOne(
      `SELECT pr.*, 
              d.doctor_uid, du.full_name as doctor_name, d.bmdc_license_number, d.specialization, d.qualifications, d.hospital_affiliation, d.chamber_details, du.phone as doctor_phone,
              p.patient_uid, pu.full_name as patient_name, p.gender, p.date_of_birth, p.blood_group, pu.phone as patient_phone,
              mr.record_uid, mr.visit_date
       FROM prescriptions pr
       JOIN doctors d ON pr.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       JOIN patients p ON pr.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN medical_records mr ON pr.record_id = mr.id
       WHERE pr.id = ? OR pr.prescription_uid = ?`,
      [id, id]
    );

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    // Role check
    if (req.user?.role === 'PATIENT' && req.user.patientId !== prescription.patient_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const items = await query('SELECT * FROM prescription_items WHERE prescription_id = ?', [prescription.id]);
    const vitals = await queryOne('SELECT * FROM vital_signs WHERE record_id = ?', [prescription.record_id]);
    const diagnoses = await query('SELECT * FROM diagnoses WHERE record_id = ?', [prescription.record_id]);

    return res.json({
      success: true,
      data: {
        ...prescription,
        items,
        vitals,
        diagnoses
      }
    });
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve prescription.' });
  }
}

export async function listPrescriptions(req: Request, res: Response) {
  try {
    let sql = `
      SELECT pr.*, 
             d.doctor_uid, du.full_name as doctor_name, d.specialization,
             p.patient_uid, pu.full_name as patient_name
      FROM prescriptions pr
      JOIN doctors d ON pr.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      JOIN patients p ON pr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
    `;
    const params: any[] = [];

    if (req.user?.role === 'PATIENT') {
      sql += ` WHERE pr.patient_id = ?`;
      params.push(req.user.patientId);
    } else if (req.user?.role === 'DOCTOR') {
      sql += ` WHERE pr.doctor_id = ?`;
      params.push(req.user.doctorId);
    }

    sql += ` ORDER BY pr.issue_date DESC LIMIT 50`;
    const prescriptions = await query(sql, params);

    return res.json({ success: true, data: prescriptions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list prescriptions.' });
  }
}

export async function downloadPrescriptionPDF(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const prescription = await queryOne(
      `SELECT pr.*, 
              d.doctor_uid, du.full_name as doctor_name, d.bmdc_license_number, d.specialization, d.qualifications, d.hospital_affiliation, d.chamber_details, du.phone as doctor_phone,
              p.patient_uid, pu.full_name as patient_name, p.gender, p.date_of_birth, p.blood_group, pu.phone as patient_phone,
              mr.record_uid, mr.visit_date
       FROM prescriptions pr
       JOIN doctors d ON pr.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       JOIN patients p ON pr.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN medical_records mr ON pr.record_id = mr.id
       WHERE pr.id = ? OR pr.prescription_uid = ?`,
      [id, id]
    );

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    const items = await query('SELECT * FROM prescription_items WHERE prescription_id = ?', [prescription.id]);
    const vitals = await queryOne('SELECT * FROM vital_signs WHERE record_id = ?', [prescription.record_id]);
    const diagnoses = await query('SELECT * FROM diagnoses WHERE record_id = ?', [prescription.record_id]);

    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'UNKNOWN',
      action: 'PRESCRIPTION_PDF_EXPORTED',
      targetResource: 'prescriptions',
      targetId: prescription.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Exported prescription PDF ${prescription.prescription_uid} for ${prescription.patient_name}`
    });

    const pdfData = {
      prescriptionUid: prescription.prescription_uid,
      issueDate: prescription.issue_date,
      instructions: prescription.instructions,
      doctor: {
        fullName: prescription.doctor_name,
        specialization: prescription.specialization,
        qualifications: prescription.qualifications,
        licenseNumber: prescription.bmdc_license_number,
        hospital: prescription.hospital_affiliation,
        chamber: prescription.chamber_details,
        phone: prescription.doctor_phone,
      },
      patient: {
        fullName: prescription.patient_name,
        patientUid: prescription.patient_uid,
        gender: prescription.gender,
        dateOfBirth: prescription.date_of_birth,
        bloodGroup: prescription.blood_group,
        phone: prescription.patient_phone,
      },
      vitals: vitals ? {
        systolicBp: vitals.systolic_bp,
        diastolicBp: vitals.diastolic_bp,
        heartRate: vitals.heart_rate,
        temperature: vitals.temperature,
        spo2: vitals.spo2,
        weightKg: vitals.weight_kg,
        bmi: vitals.bmi,
      } : undefined,
      diagnoses: diagnoses.map((d: any) => ({
        icd10Code: d.icd10_code,
        diagnosisTitle: d.diagnosis_title,
        severity: d.severity,
      })),
      items: items.map((i: any) => ({
        medicationName: i.medication_name,
        genericName: i.generic_name,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        instructions: i.instructions,
      })),
    };

    generatePrescriptionPDF(pdfData, res);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate prescription PDF.' });
  }
}
