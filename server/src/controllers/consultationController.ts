import { Request, Response } from 'express';
import { execute, query, queryOne, runTransaction } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { generateConsultationSummaryPDF, generatePatientHealthSummaryPDF } from '../services/pdfService.js';

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
    const patient = await queryOne<{ id: string; user_id: string; patient_uid: string }>(
      'SELECT id, user_id, patient_uid FROM patients WHERE id = ? OR patient_uid = ?',
      [patientId, patientId]
    );
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

    // 8. Dispatch Real-Time Patient In-App Notifications
    if (patient.user_id) {
      try {
        if (prescriptionId) {
          await createNotification({
            userId: patient.user_id,
            title: 'Digital Prescription Signed',
            message: `Prescription #${prescriptionUid} digitally signed and anchored with cryptographic seal.`,
            type: 'SUCCESS',
            category: 'PRESCRIPTION',
            link: `/prescription/${prescriptionId}`
          });
        } else {
          await createNotification({
            userId: patient.user_id,
            title: 'New Consultation Summary',
            message: `Clinical consultation #${recordUid} has been recorded to your longitudinal health record.`,
            type: 'INFO',
            category: 'GENERAL',
            link: `/patient/timeline/${patient.id}`
          });
        }

        if (Array.isArray(labOrders) && labOrders.length > 0) {
          await createNotification({
            userId: patient.user_id,
            title: 'Diagnostic Lab Order Placed',
            message: `${labOrders.length} laboratory diagnostic investigation(s) ordered by your physician.`,
            type: 'WARNING',
            category: 'LAB_RESULT',
            link: `/patient/timeline/${patient.id}`
          });
        }
      } catch (notifErr) {
        console.error('Failed to dispatch notification on consultation create:', notifErr);
      }
    }

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

export async function downloadConsultationPDF(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const record = await queryOne(
      `SELECT r.*, 
              d.doctor_uid, du.full_name as doctor_name, d.bmdc_license_number, d.specialization, d.qualifications, d.hospital_affiliation, d.chamber_details, du.phone as doctor_phone,
              p.patient_uid, pu.full_name as patient_name, p.gender, p.date_of_birth, p.blood_group, pu.phone as patient_phone
       FROM medical_records r
       JOIN doctors d ON r.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       JOIN patients p ON r.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       WHERE r.id = ? OR r.record_uid = ?`,
      [id, id]
    );

    if (!record) {
      return res.status(404).json({ success: false, message: 'Consultation record not found.' });
    }

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
    const allergies = await query('SELECT allergen, severity FROM allergies WHERE patient_id = ?', [record.patient_id]);
    const conditions = await query('SELECT condition_name, status FROM medical_conditions WHERE patient_id = ?', [record.patient_id]);

    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'UNKNOWN',
      action: 'CONSULTATION_PDF_EXPORTED',
      targetResource: 'medical_records',
      targetId: record.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Exported consultation summary PDF ${record.record_uid} for ${record.patient_name}`
    });

    const pdfData = {
      recordUid: record.record_uid,
      visitDate: record.visit_date,
      chiefComplaint: record.chief_complaint,
      clinicalNotes: record.clinical_notes,
      followUpDate: record.follow_up_date,
      doctor: {
        fullName: record.doctor_name,
        specialization: record.specialization,
        qualifications: record.qualifications,
        licenseNumber: record.bmdc_license_number,
        hospital: record.hospital_affiliation,
        chamber: record.chamber_details,
        phone: record.doctor_phone,
      },
      patient: {
        fullName: record.patient_name,
        patientUid: record.patient_uid,
        gender: record.gender,
        dateOfBirth: record.date_of_birth,
        bloodGroup: record.blood_group,
        phone: record.patient_phone,
        allergies: allergies.map((a: any) => ({ allergen: a.allergen, severity: a.severity })),
        conditions: conditions.map((c: any) => ({ conditionName: c.condition_name, status: c.status })),
      },
      vitals: vitals ? {
        systolicBp: vitals.systolic_bp,
        diastolicBp: vitals.diastolic_bp,
        heartRate: vitals.heart_rate,
        temperature: vitals.temperature,
        spo2: vitals.spo2,
        weightKg: vitals.weight_kg,
        heightCm: vitals.height_cm,
        bmi: vitals.bmi,
      } : undefined,
      diagnoses: diagnoses.map((d: any) => ({
        icd10Code: d.icd10_code,
        diagnosisTitle: d.diagnosis_title,
        severity: d.severity,
        description: d.description,
      })),
      prescription: prescription ? {
        prescriptionUid: prescription.prescription_uid,
        instructions: prescription.instructions,
        items: prescriptionItems.map((i: any) => ({
          medicationName: i.medication_name,
          genericName: i.generic_name,
          dosage: i.dosage,
          frequency: i.frequency,
          duration: i.duration,
          instructions: i.instructions,
        })),
      } : undefined,
      labOrders: labReports.map((l: any) => ({
        testName: l.test_name,
        category: l.category,
        status: l.status,
        resultsSummary: l.results_summary,
      })),
    };

    await generateConsultationSummaryPDF(pdfData, res);
  } catch (error: any) {
    console.error('Error generating consultation PDF:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate consultation PDF.' });
  }
}

export async function downloadPatientSummaryPDF(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const patient = await queryOne(
      `SELECT p.*, u.full_name, u.phone, u.email
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? OR p.patient_uid = ?`,
      [id, id]
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found.' });
    }

    if (req.user?.role === 'PATIENT' && req.user.patientId !== patient.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const allergies = await query('SELECT * FROM allergies WHERE patient_id = ?', [patient.id]);
    const conditions = await query('SELECT * FROM medical_conditions WHERE patient_id = ?', [patient.id]);
    const consultations = await query(
      `SELECT r.record_uid, r.visit_date, du.full_name as doctor_name, d.specialization, r.chief_complaint,
              COALESCE(GROUP_CONCAT(diag.diagnosis_title, ', '), 'None') as diagnoses
       FROM medical_records r
       JOIN doctors d ON r.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       LEFT JOIN diagnoses diag ON diag.record_id = r.id
       WHERE r.patient_id = ?
       GROUP BY r.id
       ORDER BY r.visit_date DESC LIMIT 10`,
      [patient.id]
    );

    const prescriptions = await query(
      `SELECT pr.prescription_uid, pr.issue_date, du.full_name as doctor_name,
              COUNT(pi.id) as items_count,
              COALESCE(GROUP_CONCAT(pi.medication_name, ', '), '') as items_summary
       FROM prescriptions pr
       JOIN doctors d ON pr.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
       WHERE pr.patient_id = ?
       GROUP BY pr.id
       ORDER BY pr.issue_date DESC LIMIT 10`,
      [patient.id]
    );

    const labReports = await query(
      `SELECT test_name, category, test_date, status, results_summary
       FROM lab_reports
       WHERE patient_id = ?
       ORDER BY test_date DESC LIMIT 10`,
      [patient.id]
    );

    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'UNKNOWN',
      action: 'PATIENT_SUMMARY_PDF_EXPORTED',
      targetResource: 'patients',
      targetId: patient.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Exported longitudinal health dossier PDF for ${patient.full_name}`
    });

    const pdfData = {
      patient: {
        fullName: patient.full_name,
        patientUid: patient.patient_uid,
        gender: patient.gender,
        dateOfBirth: patient.date_of_birth,
        bloodGroup: patient.blood_group,
        phone: patient.phone,
        address: patient.address,
        city: patient.city,
        district: patient.district,
        nidOrBid: patient.nid_or_bid,
        emergencyContactName: patient.emergency_contact_name,
        emergencyContactPhone: patient.emergency_contact_phone,
        emergencyContactRelation: patient.emergency_contact_relation,
      },
      allergies: allergies.map((a: any) => ({
        allergen: a.allergen,
        allergenType: a.allergen_type,
        severity: a.severity,
        reaction: a.reaction,
      })),
      chronicConditions: conditions.map((c: any) => ({
        conditionName: c.condition_name,
        status: c.status,
        diagnosedDate: c.diagnosed_date,
      })),
      consultations: consultations.map((c: any) => ({
        recordUid: c.record_uid,
        visitDate: c.visit_date,
        doctorName: c.doctor_name,
        specialization: c.specialization,
        chiefComplaint: c.chief_complaint,
        diagnoses: c.diagnoses,
      })),
      activePrescriptions: prescriptions.map((p: any) => ({
        prescriptionUid: p.prescription_uid,
        issueDate: p.issue_date,
        doctorName: p.doctor_name,
        itemsSummary: p.items_summary || `${p.items_count} medication(s)`,
      })),
      labReports: labReports.map((l: any) => ({
        testName: l.test_name,
        category: l.category,
        testDate: l.test_date,
        status: l.status,
        resultsSummary: l.results_summary,
      })),
    };

    await generatePatientHealthSummaryPDF(pdfData, res);
  } catch (error: any) {
    console.error('Error generating patient health summary PDF:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate patient health summary PDF.' });
  }
}
