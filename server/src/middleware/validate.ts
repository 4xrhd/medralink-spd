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
// Strips HTML tags instead of entity-escaping, so stored clinical text stays readable in the UI and PDFs.
const stripTags = (value: unknown) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value);
const idParam = (name: string) => param(name).trim().isLength({ min: 1, max: 64 }).matches(/^[A-Za-z0-9_-]+$/);
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
  ],
  updateProfile: [
    body('fullName').optional().isString().trim().isLength({ min: 2, max: 120 }).customSanitizer(stripTags),
    body('phone').optional().isString().trim().matches(/^\+?[0-9 -]{7,20}$/),
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
    body('diagnoses').optional().isArray({ max: 50 }),
    body('labOrders').optional().isArray({ max: 50 }),
    body('prescription.items').optional().isArray({ max: 50 }),
  ],
  appointment: [
    body('doctorId').isString().trim().notEmpty().isLength({ max: 64 }),
    body('patientId').optional().isString().trim().isLength({ max: 64 }),
    body('appointmentDate').isISO8601().withMessage('appointmentDate must be an ISO 8601 date.'),
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
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  ],
};
