import { Request, Response } from 'express';
import { execute, query, queryOne } from '../db/database.js';
import { recordAuditEvent } from '../services/auditService.js';

export async function createAppointment(req: Request, res: Response) {
  try {
    const { patientId, doctorId, appointmentDate, timeSlot, reason } = req.body;
    if (!patientId || !doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Missing required appointment booking fields.' });
    }

    const patient = await queryOne('SELECT id, patient_uid FROM patients WHERE id = ? OR patient_uid = ?', [patientId, patientId]);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const doctor = await queryOne('SELECT id, doctor_uid FROM doctors WHERE id = ? OR doctor_uid = ?', [doctorId, doctorId]);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const aptId = 'apt-' + Math.random().toString(36).substring(2, 10);
    const aptUid = 'APT-' + Math.floor(100 + Math.random() * 900);

    await execute(
      `INSERT INTO appointments (id, appointment_uid, patient_id, doctor_id, appointment_date, time_slot, status, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [aptId, aptUid, patient.id, doctor.id, appointmentDate, timeSlot, 'SCHEDULED', reason || 'Clinical Consultation']
    );

    await recordAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role || 'UNKNOWN',
      action: 'APPOINTMENT_SCHEDULED',
      targetResource: 'appointments',
      targetId: aptId,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Appointment ${aptUid} scheduled for patient ${patient.patient_uid} with doctor ${doctor.doctor_uid}`
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: { id: aptId, appointmentUid: aptUid }
    });
  } catch (error: any) {
    console.error('Appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to schedule appointment.' });
  }
}

export async function listAppointments(req: Request, res: Response) {
  try {
    let sql = `
      SELECT a.*,
             p.patient_uid, pu.full_name as patient_name, pu.phone as patient_phone,
             d.doctor_uid, du.full_name as doctor_name, d.specialization as doctor_specialization, d.chamber_details
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
    `;
    const params: any[] = [];

    if (req.user?.role === 'PATIENT') {
      sql += ` WHERE a.patient_id = ?`;
      params.push(req.user.patientId);
    } else if (req.user?.role === 'DOCTOR') {
      sql += ` WHERE a.doctor_id = ?`;
      params.push(req.user.doctorId);
    }

    sql += ` ORDER BY a.appointment_date ASC, a.created_at DESC LIMIT 50`;
    const appointments = await query(sql, params);

    return res.json({ success: true, data: appointments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list appointments.' });
  }
}

export async function updateAppointmentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    await execute('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    return res.json({ success: true, message: `Appointment status updated to ${status}.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update appointment.' });
  }
}
