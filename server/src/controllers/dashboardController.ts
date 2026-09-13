import { Request, Response } from 'express';
import { query, queryOne } from '../db/database.js';

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const role = req.user?.role;

    if (role === 'ADMIN') {
      const totalPatients = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM patients');
      const totalDoctors = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM doctors');
      const totalRecords = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM medical_records');
      const totalAudits = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM audit_logs');
      const recentAudits = await query(
        `SELECT a.*, u.full_name as actor_name
         FROM audit_logs a
         LEFT JOIN users u ON a.actor_id = u.id
         ORDER BY a.timestamp DESC LIMIT 8`
      );

      return res.json({
        success: true,
        data: {
          role: 'ADMIN',
          stats: {
            totalPatients: totalPatients?.count || 0,
            totalDoctors: totalDoctors?.count || 0,
            totalRecords: totalRecords?.count || 0,
            totalAuditLogs: totalAudits?.count || 0,
          },
          recentAudits
        }
      });
    } else if (role === 'DOCTOR') {
      const doctorId = req.user?.doctorId;
      const today = new Date().toISOString().split('T')[0];

      const todayAppointments = await query(
        `SELECT a.*, p.patient_uid, pu.full_name as patient_name, pu.phone as patient_phone
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         WHERE a.doctor_id = ? AND a.appointment_date = ?
         ORDER BY a.time_slot ASC`,
        [doctorId, today]
      );

      const recentConsultations = await query(
        `SELECT mr.*, p.patient_uid, pu.full_name as patient_name
         FROM medical_records mr
         JOIN patients p ON mr.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         WHERE mr.doctor_id = ?
         ORDER BY mr.visit_date DESC LIMIT 5`,
        [doctorId]
      );

      const totalConsultations = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM medical_records WHERE doctor_id = ?',
        [doctorId]
      );

      const totalRx = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM prescriptions WHERE doctor_id = ?',
        [doctorId]
      );

      return res.json({
        success: true,
        data: {
          role: 'DOCTOR',
          stats: {
            todayAppointmentsCount: todayAppointments.length,
            totalConsultations: totalConsultations?.count || 0,
            totalPrescriptionsIssued: totalRx?.count || 0,
          },
          todayAppointments,
          recentConsultations
        }
      });
    } else if (role === 'PATIENT') {
      const patientId = req.user?.patientId;

      const totalVisits = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM medical_records WHERE patient_id = ?',
        [patientId]
      );

      const activePrescriptions = await query(
        `SELECT pr.*, du.full_name as doctor_name, d.specialization
         FROM prescriptions pr
         JOIN doctors d ON pr.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         WHERE pr.patient_id = ?
         ORDER BY pr.issue_date DESC LIMIT 3`,
        [patientId]
      );

      const labReportsCount = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM lab_reports WHERE patient_id = ?',
        [patientId]
      );

      const latestVitals = await queryOne(
        `SELECT vs.*, mr.visit_date
         FROM vital_signs vs
         JOIN medical_records mr ON vs.record_id = mr.id
         WHERE mr.patient_id = ?
         ORDER BY mr.visit_date DESC LIMIT 1`,
        [patientId]
      );

      const allergies = await query('SELECT * FROM allergies WHERE patient_id = ?', [patientId]);
      const conditions = await query('SELECT * FROM medical_conditions WHERE patient_id = ?', [patientId]);

      return res.json({
        success: true,
        data: {
          role: 'PATIENT',
          stats: {
            totalVisits: totalVisits?.count || 0,
            activePrescriptionsCount: activePrescriptions.length,
            labReportsCount: labReportsCount?.count || 0,
          },
          activePrescriptions,
          latestVitals,
          allergies,
          conditions
        }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid role for dashboard.' });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics.' });
  }
}
