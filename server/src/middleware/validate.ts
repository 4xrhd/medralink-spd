import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

/**
 * Runs the given express-validator chains and rejects the request with a
 * uniform 400 envelope listing each failing field.
 */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(chains.map((chain) => chain.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }
    const errors = result.array().map((e) => ({
      field: e.type === 'field' ? e.path : e.type,
      message: e.msg,
    }));
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  };
}

const APPOINTMENT_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const DIAGNOSIS_SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];
const DIAGNOSIS_STATUSES = ['ACTIVE', 'RESOLVED', 'CHRONIC'];
// Strips HTML tags instead of entity-escaping, so stored clinical text stays readable in the UI and PDFs.
const stripTags = (value: unknown) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value);
const idParam = (name: string) => param(name).trim().isLength({ min: 1, max: 64 }).matches(/^[A-Za-z0-9_-]+$/);
const vital = (field: string, min: number, max: number) =>
  body(field).optional({ values: 'falsy' }).isFloat({ min, max }).withMessage(`${field.split('.').pop()} must be between ${min} and ${max}.`).toFloat();
const freeText = (field: string, max: number) => body(field).optional({ values: 'falsy' }).isString().trim().isLength({ max }).customSanitizer(stripTags);

export const rules = {
  login: [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail({ gmail_remove_dots: false }),
    body('password').isString().notEmpty().withMessage('Password is required.'),
  ],
  register: [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail({ gmail_remove_dots: false }),
    body('password').isString().isLength({ min: 8, max: 128 }).withMessage('Password must be 8 to 128 characters.'),
    body('fullName').isString().trim().isLength({ min: 2, max: 120 }).customSanitizer(stripTags),
    body('phone').isString().trim().matches(/^\+?[0-9 -]{7,20}$/).withMessage('A valid phone number is required.'),
    body('role').isIn(['PATIENT', 'DOCTOR']).withMessage('Role must be PATIENT or DOCTOR.'),
    // A doctor must give a real licence number; the server never makes one up
    body('doctorData.bmdcLicenseNumber')
      .if(body('role').equals('DOCTOR'))
      .isString().trim().isLength({ min: 3, max: 40 }).withMessage('BMDC licence number is required for doctors.')
      .matches(/^[A-Za-z0-9-]+$/).withMessage('BMDC licence number may only contain letters, digits and hyphens.'),
    freeText('doctorData.specialization', 120),
    freeText('doctorData.qualifications', 200),
    freeText('doctorData.hospitalAffiliation', 200),
    freeText('doctorData.chamberDetails', 300),
    body('doctorData.consultationFee').optional({ values: 'falsy' }).isFloat({ min: 0, max: 100000 }).toFloat(),
    body('patientData.dateOfBirth').optional({ values: 'falsy' }).isISO8601({ strict: true }),
    body('patientData.gender').optional({ values: 'falsy' }).isIn(['MALE', 'FEMALE', 'OTHER']),
    body('patientData.bloodGroup').optional({ values: 'falsy' }).isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  ],
  updateProfile: [
    body('fullName').optional().isString().trim().isLength({ min: 2, max: 120 }).customSanitizer(stripTags),
    body('phone').optional().isString().trim().matches(/^\+?[0-9 -]{7,20}$/),
  ],
  changeEmail: [
    body('newEmail').isEmail().withMessage('A valid email is required.').isLength({ max: 254 }).normalizeEmail({ gmail_remove_dots: false }),
    body('currentPassword').isString().notEmpty().withMessage('Enter your current password.'),
  ],
  changePassword: [
    body('currentPassword').isString().notEmpty(),
    body('newPassword').isString().isLength({ min: 8, max: 128 }).withMessage('Password must be 8 to 128 characters.'),
  ],
  forgotPassword: [body('email').isEmail().normalizeEmail({ gmail_remove_dots: false })],
  resetPassword: [
    body('token').isString().isLength({ min: 32, max: 128 }),
    body('newPassword').isString().isLength({ min: 8, max: 128 }).withMessage('Password must be 8 to 128 characters.'),
  ],
  consultation: [
    body('patientId').isString().trim().notEmpty().isLength({ max: 64 }),
    body('chiefComplaint').isString().trim().notEmpty().withMessage('Chief complaint is required.').isLength({ max: 1000 }).customSanitizer(stripTags),
    freeText('clinicalNotes', 5000),
    body('followUpDate').optional({ values: 'falsy' }).isISO8601(),
    body('labOrders').optional().isArray({ max: 50 }),
    body('appointmentId').optional({ values: 'falsy' }).isString().isLength({ max: 64 }),
    body('diagnoses').optional().isArray({ max: 50 }),
    body('diagnoses.*.diagnosisTitle').isString().trim().notEmpty().isLength({ max: 300 }).customSanitizer(stripTags),
    body('diagnoses.*.icd10Code').optional({ values: 'falsy' }).isString().trim().isLength({ max: 16 }),
    body('diagnoses.*.severity').optional({ values: 'falsy' }).isIn(DIAGNOSIS_SEVERITIES),
    body('diagnoses.*.status').optional({ values: 'falsy' }).isIn(DIAGNOSIS_STATUSES),
    body('labOrders.*.testName').isString().trim().notEmpty().isLength({ max: 200 }).customSanitizer(stripTags),
    body('prescription.items').optional().isArray({ max: 50 }),
    body('prescription.items.*.medicationName').isString().trim().notEmpty().withMessage('Every medicine needs a name.').isLength({ max: 200 }).customSanitizer(stripTags),
    body('prescription.items.*.dosage').isString().trim().notEmpty().withMessage('Every medicine needs a dosage.').isLength({ max: 100 }),
    body('prescription.items.*.frequency').isString().trim().notEmpty().withMessage('Every medicine needs a frequency.').isLength({ max: 100 }),
    body('prescription.items.*.duration').isString().trim().notEmpty().withMessage('Every medicine needs a duration.').isLength({ max: 100 }),
    freeText('prescription.items.*.genericName', 200),
    freeText('prescription.items.*.route', 50),
    freeText('prescription.items.*.instructions', 500),
    freeText('prescription.instructions', 2000),
    body('prescription.validityDays').optional({ values: 'falsy' }).isInt({ min: 1, max: 365 }).toInt(),
    freeText('diagnoses.*.description', 1000),
    freeText('labOrders.*.category', 100),
    freeText('labOrders.*.instructions', 500),
    // Vitals: numbers within a range a living patient can have, so typos are caught before they are stored
    vital('vitals.systolicBp', 40, 300),
    vital('vitals.diastolicBp', 20, 200),
    vital('vitals.heartRate', 20, 300),
    vital('vitals.temperature', 25, 45),
    vital('vitals.respiratoryRate', 4, 80),
    vital('vitals.spo2', 30, 100),
    vital('vitals.weightKg', 0.5, 400),
    vital('vitals.heightCm', 30, 260),
  ],
  doctorVerify: [idParam('id'), body('isVerified').isBoolean({ strict: true }).withMessage('isVerified must be true or false.').toBoolean(true)],
  appointment: [
    body('doctorId').optional({ values: 'falsy' }).isString().trim().isLength({ max: 64 }),
    body('patientId').optional().isString().trim().isLength({ max: 64 }),
    body('appointmentDate').matches(/^\d{4}-\d{2}-\d{2}$/).isISO8601({ strict: true }).withMessage('appointmentDate must be a date like 2026-12-01.'),
    body('timeSlot').isString().trim().notEmpty().isLength({ max: 32 }),
    freeText('reason', 500),
  ],
  appointmentStatus: [idParam('id'), body('status').isIn(APPOINTMENT_STATUSES)],
  labUpload: [
    body('patientId').isString().trim().notEmpty().isLength({ max: 64 }),
    body('testName').isString().trim().notEmpty().isLength({ max: 200 }).customSanitizer(stripTags),
    body('category').isString().trim().notEmpty().isLength({ max: 100 }).customSanitizer(stripTags),
    body('testDate').optional({ values: 'falsy' }).isISO8601(),
    freeText('resultsSummary', 2000),
  ],
  idParam: [idParam('id')],
  adminUserUpdate: [
    idParam('id'),
    body('status').isIn(['ACTIVE', 'PENDING', 'SUSPENDED']),
  ],
  auditFilters: [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('role').optional().isIn(['PATIENT', 'DOCTOR', 'ADMIN']),
    query('userId').optional().isString().isLength({ max: 64 }),
    query('action').optional().isString().isLength({ max: 64 }),
    query('search').optional().isString().trim().isLength({ max: 120 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  ],
};
