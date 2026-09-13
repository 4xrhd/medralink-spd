import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { execute, query, queryOne } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `lab_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPG, PNG, WebP) are allowed.'));
    }
  }
});

export async function uploadLabReport(req: Request, res: Response) {
  try {
    const { patientId, recordId, testName, category, testDate, resultsSummary } = req.body;
    if (!patientId || !testName || !category) {
      return res.status(400).json({ success: false, message: 'Patient ID, Test Name, and Category are required.' });
    }

    const patient = await queryOne('SELECT id, patient_uid FROM patients WHERE id = ? OR patient_uid = ?', [patientId, patientId]);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const file = req.file;
    const labId = 'lab-' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString().split('T')[0];

    await execute(
      `INSERT INTO lab_reports (id, record_id, patient_id, test_name, category, file_path, file_url, file_name, file_size, mime_type, test_date, results_summary, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        labId,
        recordId || null,
        patient.id,
        testName,
        category,
        file ? file.path : null,
        file ? `/uploads/${file.filename}` : null,
        file ? file.originalname : null,
        file ? file.size : null,
        file ? file.mimetype : null,
        testDate || now,
        resultsSummary || '',
        'COMPLETED'
      ]
    );

    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'UNKNOWN',
      action: 'LAB_REPORT_UPLOADED',
      targetResource: 'lab_reports',
      targetId: labId,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Diagnostic lab report '${testName}' attached for patient ${patient.patient_uid}`
    });

    return res.status(201).json({
      success: true,
      message: 'Lab report uploaded successfully.',
      data: {
        id: labId,
        fileUrl: file ? `/uploads/${file.filename}` : null
      }
    });
  } catch (error: any) {
    console.error('Error uploading lab report:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload diagnostic report.' });
  }
}

export async function listLabReports(req: Request, res: Response) {
  try {
    let sql = `
      SELECT lr.*, p.patient_uid, u.full_name as patient_name
      FROM lab_reports lr
      JOIN patients p ON lr.patient_id = p.id
      JOIN users u ON p.user_id = u.id
    `;
    const params: any[] = [];

    if (req.user?.role === 'PATIENT') {
      sql += ` WHERE lr.patient_id = ?`;
      params.push(req.user.patientId);
    } else if (req.query.patientId) {
      sql += ` WHERE lr.patient_id = ?`;
      params.push(req.query.patientId);
    }

    sql += ` ORDER BY lr.test_date DESC, lr.created_at DESC LIMIT 50`;
    const reports = await query(sql, params);

    return res.json({ success: true, data: reports });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list lab reports.' });
  }
}
