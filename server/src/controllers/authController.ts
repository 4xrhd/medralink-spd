import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { execute, queryOne } from '../db/database.js';
import { generateToken } from '../middleware/auth.js';
import { recordAuditEvent } from '../services/auditService.js';
import { User } from '../types/index.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await queryOne<User>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    let patientId: string | undefined;
    let patientUid: string | undefined;
    let doctorId: string | undefined;
    let doctorUid: string | undefined;

    if (user.role === 'PATIENT') {
      const patient = await queryOne<{ id: string; patient_uid: string }>(
        'SELECT id, patient_uid FROM patients WHERE user_id = ?',
        [user.id]
      );
      patientId = patient?.id;
      patientUid = patient?.patient_uid;
    } else if (user.role === 'DOCTOR') {
      const doctor = await queryOne<{ id: string; doctor_uid: string }>(
        'SELECT id, doctor_uid FROM doctors WHERE user_id = ?',
        [user.id]
      );
      doctorId = doctor?.id;
      doctorUid = doctor?.doctor_uid;
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      patientId,
      patientUid,
      doctorId,
      doctorUid,
    };

    const token = generateToken(tokenPayload);

    // Record audit event
    await recordAuditEvent({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      targetResource: 'users',
      targetId: user.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `Successful login by ${user.role} (${user.email})`
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
          phone: user.phone,
          patientId,
          patientUid,
          doctorId,
          doctorUid,
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName, phone, role, patientData, doctorData } = req.body;
    if (!email || !password || !fullName || !phone || !role) {
      return res.status(400).json({ success: false, message: 'Required registration fields missing.' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr-' + Math.random().toString(36).substring(2, 10);

    await execute(
      'INSERT INTO users (id, email, password_hash, role, full_name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email.toLowerCase().trim(), passwordHash, role, fullName, phone, 'ACTIVE']
    );

    let patientId: string | undefined;
    let patientUid: string | undefined;
    let doctorId: string | undefined;
    let doctorUid: string | undefined;

    if (role === 'PATIENT') {
      patientId = 'pat-' + Math.random().toString(36).substring(2, 10);
      patientUid = 'P-' + Math.floor(1000 + Math.random() * 9000);
      await execute(
        `INSERT INTO patients (id, user_id, patient_uid, date_of_birth, gender, blood_group, address, city, district, nid_or_bid, emergency_contact_name, emergency_contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patientId,
          userId,
          patientUid,
          patientData?.dateOfBirth || '1990-01-01',
          patientData?.gender || 'MALE',
          patientData?.bloodGroup || 'O+',
          patientData?.address || '',
          patientData?.city || 'Dhaka',
          patientData?.district || 'Dhaka',
          patientData?.nidOrBid || '',
          patientData?.emergencyContactName || '',
          patientData?.emergencyContactPhone || '',
        ]
      );
    } else if (role === 'DOCTOR') {
      doctorId = 'doc-' + Math.random().toString(36).substring(2, 10);
      doctorUid = 'DOC-' + Math.floor(2000 + Math.random() * 8000);
      await execute(
        `INSERT INTO doctors (id, user_id, doctor_uid, bmdc_license_number, specialization, qualifications, hospital_affiliation, chamber_details, consultation_fee, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doctorId,
          userId,
          doctorUid,
          doctorData?.bmdcLicenseNumber || `BMDC-A-${Math.floor(10000 + Math.random() * 90000)}`,
          doctorData?.specialization || 'General Medicine',
          doctorData?.qualifications || 'MBBS',
          doctorData?.hospitalAffiliation || '',
          doctorData?.chamberDetails || '',
          doctorData?.consultationFee || 500,
          1 // auto-verified for prototype simplicity
        ]
      );
    }

    await recordAuditEvent({
      actorId: userId,
      actorRole: role,
      action: 'USER_REGISTERED',
      targetResource: 'users',
      targetId: userId,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      details: `New ${role} registration: ${email}`
    });

    const token = generateToken({
      id: userId,
      email: email.toLowerCase().trim(),
      role,
      fullName,
      patientId,
      patientUid,
      doctorId,
      doctorUid
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: { id: userId, email, role, fullName, phone, patientId, patientUid, doctorId, doctorUid }
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const user = await queryOne<User>('SELECT id, email, role, full_name, phone, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let extraData = null;
    if (user.role === 'PATIENT') {
      extraData = await queryOne('SELECT * FROM patients WHERE user_id = ?', [user.id]);
    } else if (user.role === 'DOCTOR') {
      extraData = await queryOne('SELECT * FROM doctors WHERE user_id = ?', [user.id]);
    }

    return res.json({
      success: true,
      data: {
        ...user,
        profile: extraData
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error retrieving user profile.' });
  }
}
