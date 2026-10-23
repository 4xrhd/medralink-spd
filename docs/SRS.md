# System Requirements Specification (SRS) | Web Version

**Notice:** This documentation applies exclusively to the **Web Version** of the MedraLink prototype.

## Functional Requirements

* User registration/login
* Profile management, password change and password reset
* Patient registration
* Medical record creation
* Prescription management
* Lab report management
* Appointment management
* Role-based access (Admin, Doctor, Patient)
* Medical history viewing
* Interactive Patient Medical Timeline
* PDF prescription generation
* Emergency hospital locator and nearby medical facility search with specialization filter (OpenStreetMap, no API key)
* Real-time GPS geolocation detection and distance computation
* Turn-by-turn emergency navigation and one-touch facility dialing
* National health emergency hotline integration (24/7 Toll-free 16263)
* Audit logging of all modifications, patient record reads and refused access attempts
* Administrator user management (suspend / reactivate) and system parameter configuration
* Audit log filtering by date range, user, role and action

## Non-functional Requirements

* Security (JWT, RBAC with doctor-to-patient assignment, password hashing, input validation, SQL injection protection, XSS protection, append-only audit log, Supabase RLS)
* Accessibility (WCAG 2.1 AA, verified with axe-core)
* Testability (80% line coverage gate in CI)
* Availability
* Usability (Bengali + English interface support)
* Maintainability
* Scalability (Stateless Node.js backend)
* Performance (PostgreSQL performance indexing)

## Implementation Status (23 October 2026)

| Requirement | Implementation | Verified by |
| :--- | :--- | :--- |
| Registration, login, profile, password reset | `authRoutes.ts`, `accountController.ts` | `account.test.ts`, `workflows.test.ts` |
| Role-based access with doctor assignment | `rbac.ts`, `accessService.ts` | `security.test.ts` |
| Medical records, prescriptions, PDFs | `consultationController.ts`, `prescriptionController.ts`, `pdfService.ts` | `api.test.ts` |
| Lab report upload and listing | `labReportController.ts` | `workflows.test.ts` |
| Appointments | `appointmentController.ts` | `workflows.test.ts` |
| Patient medical timeline | `patientController.ts`, `PatientTimelinePage.tsx` | `security.test.ts`, browser check |
| Audit logging (reads, writes, denials; append-only) | `auditService.ts`, `database.ts` triggers | `security.test.ts`, `admin.test.ts` |
| Admin user management, settings, audit filters | `adminController.ts`, `AdminPanels.tsx` | `admin.test.ts` |
| Input validation | `validate.ts` | `security.test.ts` |
| Accessibility | Theme tokens, labels | axe-core WCAG 2.1 AA scan |
| PostgreSQL persistence | Supabase, `supabase/migrations/` | Live smoke test on Supabase |

Details: `docs/date-23-oct-26/update-log.md`.
