import type { Suggestion } from './suggest.js';

/** Audit actions the API writes (server/src), with a plain description for the search box. */
const action = (value: string, hint: string): Suggestion => ({ value, hint });

export const AUDIT_ACTIONS: readonly Suggestion[] = [
  action('LOGIN_SUCCESS', 'Sign-in'), action('USER_REGISTERED', 'New account'), action('PROFILE_UPDATED', 'Profile edited'),
  action('PASSWORD_CHANGED', 'Password changed'), action('PASSWORD_RESET_REQUESTED', 'Reset link requested'),
  action('PASSWORD_RESET', 'Password reset'), action('EMAIL_CHANGED', 'Sign-in email changed'),
  action('ACCESS_DENIED', 'Blocked request'), action('VIEW_PATIENT', 'Patient profile opened'),
  action('TIMELINE_ACCESSED', 'Timeline opened'), action('CONSULTATION_CREATED', 'Consultation recorded'),
  action('APPOINTMENT_SCHEDULED', 'Appointment booked'), action('LAB_REPORT_UPLOADED', 'Lab report uploaded'),
  action('VIEW_LAB_REPORT_FILE', 'Lab report opened'), action('PRESCRIPTION_PDF_EXPORTED', 'Prescription PDF'),
  action('CONSULTATION_PDF_EXPORTED', 'Consultation PDF'), action('PATIENT_SUMMARY_PDF_EXPORTED', 'Patient summary PDF'),
  action('DOCTOR_VERIFIED', 'Doctor accredited'), action('DOCTOR_VERIFICATION_REVOKED', 'Accreditation removed'),
  action('USER_STATUS_CHANGED', 'Account suspended or reactivated'), action('SETTINGS_UPDATED', 'System settings changed'),
];
