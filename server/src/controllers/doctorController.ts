import { Request, Response } from 'express';
import { execute, query, queryOne } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';
import { Doctor } from '../types/index.js';

export async function listDoctors(req: Request, res: Response) {
  try {
    const doctors = await query<Doctor>(
      `SELECT d.*, u.full_name, u.email, u.phone, u.status as user_status
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC`
    );

    return res.json({ success: true, data: doctors });
  } catch (error: any) {
    console.error('Error listing doctors:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve doctors.' });
  }
}

export async function getDoctorById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const doctor = await queryOne<Doctor>(
      `SELECT d.*, u.full_name, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = ? OR d.doctor_uid = ?`,
      [id, id]
    );

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    return res.json({ success: true, data: doctor });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve doctor details.' });
  }
}

export async function verifyDoctor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const doctor = await queryOne('SELECT * FROM doctors WHERE id = ?', [id]);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    await execute('UPDATE doctors SET is_verified = ? WHERE id = ?', [isVerified ? 1 : 0, id]);

    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'ADMIN',
      action: 'DOCTOR_VERIFIED',
      targetResource: 'doctors',
      targetId: id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Doctor ${doctor.doctor_uid} verification set to ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}`
    });

    return res.json({ success: true, message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update doctor verification.' });
  }
}
