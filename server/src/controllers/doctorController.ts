import { Request, Response } from 'express';
import { execute, query, queryOne } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';
import { Doctor } from '../types/index.js';

/** Columns safe to show any signed-in user; contact details and account status stay admin-only. */
const PUBLIC_DOCTOR_COLUMNS = `d.id, d.doctor_uid, d.specialization, d.qualifications, d.hospital_affiliation,
  d.chamber_details, d.consultation_fee, d.is_verified, u.full_name`;

export async function listDoctors(req: Request, res: Response) {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    // Patients and doctors only see accredited, active physicians; admins see everyone to review them
    const doctors = isAdmin
      ? await query<Doctor>(
          `SELECT d.*, u.full_name, u.email, u.phone, u.status as user_status
           FROM doctors d
           JOIN users u ON d.user_id = u.id
           ORDER BY d.created_at DESC`
        )
      : await query<Doctor>(
          `SELECT ${PUBLIC_DOCTOR_COLUMNS}
           FROM doctors d
           JOIN users u ON d.user_id = u.id
           WHERE d.is_verified = 1 AND u.status = 'ACTIVE'
           ORDER BY u.full_name ASC`
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
    // The validator has already coerced isVerified to a real boolean
    const isVerified = req.body.isVerified === true;

    const doctor = await queryOne<{ doctor_uid: string; is_verified: number }>(
      'SELECT doctor_uid, is_verified FROM doctors WHERE id = ?',
      [id]
    );
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    if (Boolean(doctor.is_verified) === isVerified) {
      return res.status(409).json({
        success: false,
        message: isVerified ? 'This doctor is already accredited.' : 'This doctor\'s accreditation is already revoked.',
      });
    }

    await execute('UPDATE doctors SET is_verified = ? WHERE id = ?', [isVerified ? 1 : 0, id]);

    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'ADMIN',
      action: isVerified ? 'DOCTOR_VERIFIED' : 'DOCTOR_VERIFICATION_REVOKED',
      targetResource: 'doctors',
      targetId: id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Doctor ${doctor.doctor_uid} verification set to ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}`
    });

    return res.json({ success: true, message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully.` });
  } catch (error: any) {
    console.error('Error updating doctor verification:', error);
    return res.status(500).json({ success: false, message: 'Failed to update doctor verification.' });
  }
}
