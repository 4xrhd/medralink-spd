# MedraLink Update Log | 23 October 2026

Work done to close the gaps between the prototype and the submitted CSE 416 project proposal
(`MedraLink_Project_Proposal_CSE416.pdf`, sections 1.2, 2.1, 7.2 and 7.3), and to move the
database to Supabase PostgreSQL.

## 1. Summary

| Area | Proposal reference | Before | After |
| :--- | :--- | :--- | :--- |
| Input validation | Objective 9, sec. 7.3 | express-validator installed, unused | All write routes validated; 400 with per-field errors |
| Doctor RBAC | Sec. 2.4 roles table | Any doctor could read any patient | Doctors read only assigned patients (403 otherwise) |
| Audit trail | Objective 6 | Writes only; rows editable | Reads and denials logged; database blocks UPDATE/DELETE |
| Account management | Sec. 2.1 | Login and register only | Profile edit, password change, forgot/reset password |
| Admin console | Sec. 2.1, 7.2 | Doctor verification only | User suspend/reactivate, system settings, audit filters |
| Automated tests | Objective 11 | 20 tests, no coverage gate | 74 tests, 84% line coverage, CI gate at 80% |
| Accessibility | Objective 8 | Not verified | axe WCAG 2.1 AA: zero violations on all pages |
| Database | Objectives 1, 12 | SQLite only in practice | Supabase PostgreSQL 17 with migrations and RLS |
| Performance | Objective 7 | Timeline about 4.0 s on Supabase | About 2.0 s (N+1 queries removed) |

## 2. Security and access control

- **Validation middleware** (`server/src/middleware/validate.ts`): rule sets for login, register,
  profile, passwords, consultations, appointments, lab uploads, admin updates and audit filters.
  Free text has HTML tags stripped.
- **Record-level access** (`server/src/services/accessService.ts`): ADMIN sees all patients,
  PATIENT sees only self, DOCTOR sees patients linked by an appointment or medical record.
  Applied to patient profile, timeline, summary PDF, consultations, prescriptions and lab reports.
- **Appointments**: patients book only for themselves and may only cancel their own;
  doctors change only their own appointments.
- **Uploads**: extension and MIME type must both be PDF, JPG, PNG or WebP; random file names.
- **Suspension**: the JWT middleware re-checks account status, so a suspended user is blocked at once.

## 3. Audit trail

- New events: `VIEW_PATIENT`, `ACCESS_DENIED`, `PROFILE_UPDATED`, `PASSWORD_CHANGED`,
  `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET`, `USER_STATUS_CHANGED`, `SETTINGS_UPDATED`.
- Append-only enforced in the database: SQLite triggers and a PostgreSQL trigger reject
  UPDATE and DELETE on `audit_logs`.

## 4. New features

### API

| Method | Endpoint | Role | Purpose |
| :--- | :--- | :--- | :--- |
| PUT | `/api/v1/auth/me` | Any | Update name and phone |
| PUT | `/api/v1/auth/password` | Any | Change password (current password required) |
| POST | `/api/v1/auth/forgot-password` | Public | Issue a 30-minute single-use reset token |
| POST | `/api/v1/auth/reset-password` | Public | Reset password with token |
| GET | `/api/v1/admin/users` | Admin | List users, filter by role, status, text |
| PATCH | `/api/v1/admin/users/:id` | Admin | Suspend or reactivate a user |
| GET, PUT | `/api/v1/admin/settings` | Admin | Read and update system parameters |
| GET | `/api/v1/admin/audit-logs` | Admin | Audit query: `from`, `to`, `userId`, `role`, `action`, `page`, `limit` |

Reset email is simulated: outside production the token is returned in the response so the
demo flow can be completed. The reply is identical for unknown emails.

### Database tables

- `password_resets`: SHA-256 of the reset token, expiry, user.
- `system_settings`: key/value parameters (`clinic_name`, `max_upload_mb`, `session_ttl_hours`,
  `require_doctor_verification`).

### Client pages

- `/account`: profile and password change (linked from the navbar menu).
- `/forgot-password` and `/reset-password`: reset flow; "Forgot password?" link on login.
- Admin console: User Accounts panel, System Parameters panel, and server-side audit filters
  (role, search, last 24 hours, date range, total count).

## 5. Bug fixes

- Admin audit table showed blank timestamp, role, resource and hash columns because it read
  field names the API never returns. Fixed, and filtering now runs on the server.
- Tests wrote into the development SQLite database. Each suite now uses its own in-memory database.
- PostgreSQL transactions were not atomic: `runTransaction` opened a client but queries ran on the
  pool. Queries inside a transaction now use the transaction's client (AsyncLocalStorage).
- PostgreSQL returned `COUNT(*)` as strings and timestamps as `Date` objects; type parsers now
  return the same shapes as SQLite.
- Seed used SQLite-only `INSERT OR IGNORE`; replaced with portable `ON CONFLICT DO NOTHING`.

## 6. Accessibility (WCAG 2.1 AA)

Scanned with axe-core on landing, login, register, forgot/reset, account, patient dashboard,
patient timeline, doctor dashboard, new consultation and admin console. All now report zero violations.

- Colour tokens darkened to reach 4.5:1: success `#15803d`, warning `#b45309`, critical `#be123c`.
- Teal text and white-on-teal buttons moved from `primary-600` to `primary-700`.
- Added a missing label on the follow-up date field.
- Removed a nested interactive control on timeline cards (the chevron button remains the
  keyboard control).

## 7. Testing

| Suite | Focus |
| :--- | :--- |
| `api.test.ts` | Original suite: auth, consultations, PDFs, notifications |
| `security.test.ts` | Validation, doctor assignment, audit events, append-only log |
| `account.test.ts` | Profile, password change, forgot/reset, enumeration safety |
| `admin.test.ts` | User management, suspension, settings, audit filters |
| `workflows.test.ts` | Registration, appointments, doctors, dashboards, lab reports, prescriptions |

Coverage: 84% lines, 83% statements, 82% functions, 61% branches. `npm run test:coverage`
fails below 80% lines, statements and functions, or 60% branches (PostgreSQL-only branches are not
exercised by the SQLite run). CI now runs this command.

## 8. Supabase PostgreSQL

- Project `svieyxgbzrriwvxosbdw`, region `ap-southeast-2`, PostgreSQL 17.
- Migrations in `supabase/migrations/`: initial schema, append-only trigger, and function hardening.
- Row Level Security enabled on all 18 tables with no policies, so the Supabase Data API
  (publishable key) cannot read medical data. The backend connects as the owner role.
- The backend connects through the IPv4 Session pooler (`aws-0-ap-southeast-2.pooler.supabase.com`);
  the direct host is IPv6 only. Credentials live only in the gitignored `server/.env`.
- Supabase security advisor: only the intended "RLS enabled, no policy" notice remains.
- Verified end to end: health reports `postgres`, access denial, atomic consultation save,
  audit rows written, audit edit rejected.

## 9. Performance

Patient timeline rewritten from several queries per visit to eight parallel queries per patient.
Response on Supabase went from about 4.0 s to about 2.0 s with identical output. The remaining time
is network latency to Sydney; hosting the backend in the same region is the next step for the
under-200 ms objective.

## 10. Deployment

| Component | Host | URL |
| :--- | :--- | :--- |
| Frontend | Netlify | https://medralink.netlify.app |
| Backend API | Render (Singapore, free plan) | https://medralink-api.onrender.com |
| Database | Supabase (Sydney) | project `svieyxgbzrriwvxosbdw` |

Netlify proxies `/api/*` and `/uploads/*` to Render, so the browser uses one origin.
Verified live: health reports `postgres`, doctor sign-in, assigned timeline 200, unassigned patient 403.
The free Render plan sleeps when idle (first request about 30 to 60 s) and its disk is wiped on restart,
so uploaded lab files do not persist.

## 11. Still to do

- PostgreSQL job in CI.
- `POST /api/v1/prescriptions/:id/pdf` alias to match proposal sec. 7.2.
- Latency measurement script (p50 / p95) for the report.
- Requirements traceability matrix in the SRS.
- Rotate the Supabase database password.

## 12. Hospital search by specialization

- Patients can filter the Google Maps hospital search by specialization (emergency, cardiology,
  neurology, pediatrics, maternity, orthopedics, oncology, kidney, eye, ENT, dental, mental health, burn).
- The filter narrows the Google Places nearby search with a keyword and is kept in the URL
  (`/hospitals?specialty=cardiology`), so a filtered search can be shared.
- The patient portal's Emergency Services card has a specialization picker that opens the filtered search.
- axe WCAG 2.1 AA: zero violations on the patient dashboard and the hospital search page.
- Requires `VITE_GOOGLE_MAPS_API_KEY` (Maps JavaScript API and Places API) at build time.
