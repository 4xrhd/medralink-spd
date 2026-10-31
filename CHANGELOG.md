# Changelog

All notable changes to MedraLink. Detailed notes per date live in `docs/date-*/update-log.md`.

## 2026-10-31

### Security
- A doctor could give themselves access to any patient's record by booking them an appointment, or book patients onto another doctor's calendar. Doctors now book only on their own calendar, and only patients they already treat.
- A lab report could be linked to another patient's visit and appear in that patient's record; the visit must now belong to the same patient.
- `GET /doctors/:id` no longer shows doctor email and phone to non-admins, matching the doctor list.
- Accounts an admin sets to PENDING are now blocked at sign-in and on every request (only SUSPENDED was before).

### Fixed
- Patient, doctor, record, prescription and appointment codes could collide (APT- had only 900 values) and fail with a server error; codes are now checked for uniqueness before use.
- A failed doctor or patient registration left a half-created account that blocked the email forever; both rows are now written in one transaction.
- Doctor registration made up a random BMDC licence when none was given; a licence number is now required and validated.
- Appointments accepted past dates and date-times, which then never showed on the doctor dashboard; finished appointments could be reopened.
- Consultation vitals, prescription validity and several free-text fields were unvalidated (vitals now need physiologically possible values).
- A PDF that failed mid-download could crash the request handler with a second response.
- Lab reports filtered by patient code (P-xxxx) were refused for doctors and empty for admins.
- "Active prescriptions" counted the 3 latest prescriptions, expired or not; "Accredited physicians" counted unverified doctors.
- Opening a prescription link while signed out showed an access error; it now asks you to sign in and returns to the prescription.
- Switching between prescriptions could show the previous one's error or data.
- Doctors were offered "Review Timeline" for patients whose record they cannot open yet.
- Navbar "Users", "Settings" and "Audit trail" links now scroll to their section; the audit "From" date used UTC midnight instead of local.
- New doctors saw placeholder licence and hospital until they signed in again.
- PDF download errors now show the server's reason instead of a generic message.
- Notifications from a previous account could appear after switching accounts; account settings could overwrite text typed while loading; a late GPS answer could replace a typed hospital search location; a consultation could send an appointment that belonged to a different patient.
- Notification rows now work with the keyboard and the dismiss button shows on touch screens.
- Several English strings were not translated to Bangla.
- The audit trail "All Roles" filter wrapped onto two lines and was clipped.


### Added
- Authentic Bangladeshi healthcare visual asset library (9 high-resolution images across `/images/hero/`, `/images/doctors/`, `/images/patients/`, and `/images/hospitals/`).
- Doctor-patient consultation scene (`hero-consultation.jpg`) featuring Dr. Ahmed Tariq and a patient in a modern clinical chamber.
- Verified physician profile portraits for Dr. Ahmed Tariq (Chief Cardiologist), Dr. Nusrat Jahan (Gynecologist & Pediatrician), and Dr. Karim Hasan (Neurologist & Professor of Medicine).
- Demographic patient headshots for Rahim Ahmed (`P-1001`) and Sara Akter (`P-1002`).
- Architectural exterior facility imagery for Dhaka Medical College & Hospital, Dhaka Cardiac & Cardiovascular Hospital, and the Central Trauma & Emergency Diagnostic Institute.
- "Connected Healthcare Facilities" showcase section on the homepage with bed capacity metrics, emergency hotlines, and instant search links.
- Full Bengali (`bn.ts`) translations for all newly added medical facilities, categories, and hero captions.

### Changed
- Homepage hero section upgraded to a hybrid layout pairing the clinical consultation photography with the live interactive telemetry and prescription workstation card.
- 1-Click Evaluation persona switcher on `/login` now embeds profile portraits on the `Doctor`, `Patient`, and `Admin` role buttons for instant visual recognition.
- Doctor dashboard header upgraded to display Dr. Ahmed Tariq's verified physician profile portrait.
- Patient dashboard and longitudinal timeline headers now feature real patient portraits for `P-1001` (Rahim Ahmed) and `P-1002` (Sara Akter).
- Emergency Hospital Search (`/hospitals`) result cards upgraded with category-aware architectural thumbnails mapped to Cardiac, Trauma/Emergency, and General Medical facilities.
- New photos served as WebP at display size (about 8 MB of JPEG down to 430 KB), with fixed dimensions to stop layout shift.
- Admin tables (credentials, users, audit trail) show each row as a labelled card below 1024px instead of hiding columns behind a sideways scroll.
- Patient identity card and stat tiles stack to one column on narrow phones; ID, facility and emergency contact wrap instead of being cut off.
- Consultation action bar is shorter on phones and respects the iPhone home-indicator inset.
- Landing "Paper slips get lost" section is now a before and after: a pile of loose slips with the allergy note buried, next to the same history as one MedraLink record with the allergy first. Replaces the three 3D clip-art cards.
- Demo data looks real and agrees everywhere: the landing hero and new section use Rahim Ahmed's seeded record (BP 145/92, penicillin allergy, Amlocard, lipid profile); seeded phone numbers and NIDs no longer count up or repeat digit runs.
- Hospital showcase uses three real facilities from the bundled OpenStreetMap data (DMCH, NICVD, NITOR) and drops unsourced bed counts, hotlines and the invented trauma institute.

### Fixed
- Every doctor account showed Dr. Ahmed Tariq's portrait; only his seeded account does now.
- Map attribution printed a literal `{tr("OpenStreetMap")}`.
- Hero caption and status badges overlapped on small phones; "View Details" links were 20px tall touch targets.
- `shadow-xs` and `backdrop-blur-xs` do not exist in Tailwind 3 and silently did nothing.
- Pulsing and hover-zoom animations now respect reduced-motion settings.
- Patient identity card collapsed the name column at 1920px (name, ID and blood group wrapped letter by letter).

## 2026-10-24

### Changed
- Calmer clinical styling: one button system (including link buttons), panel title bars, page headers, flat surfaces, loading placeholders.
- Fully responsive from 360px to 1920px; the medicine list becomes labelled cards on phones; hospital list and map sit side by side on wide screens.
- Navbar links and buttons get green hover states that match the site theme.

### Fixed
- Removed made-up clinical data shown as fallbacks: a fixed "Penicillin, Sulfa" allergy alert on every consultation, sample prescriptions, vitals, lab results and a fake SHA-256 hash.
- Consultation page now shows the selected patient's real allergies.
- Error screen no longer shows stack traces in production builds.

## 2026-10-23

### Security
- Prescription PDFs and lab report files now check record-level access; lab files are no longer public.
- CORS refuses unknown origins; real client IPs behind the proxy; no internal errors in 5xx responses.
- Upload signature checks, single-use reset tokens, boot-time configuration validation.

### Fixed
- Patient summary PDF on PostgreSQL (SQLite-only GROUP_CONCAT).
- Audit hash chain could fork under concurrent writes; SQLite transactions could absorb other requests' writes.
- Wrong dashboard data (patient blood group and contact, doctor licence, admin counts).
- CI paths; every workflow run had been failing.

### Changed
- UI redesign: record-green palette, Public Sans and Bricolage Grotesque, new logo, role navigation, no invented metrics.

### Added
- PostgreSQL 16 CI job, `npm run latency`, `POST /prescriptions/:id/pdf`, client auth tests.
- Specialization filter for the hospital search, with a picker on the patient portal.
- Free OpenStreetMap hospital search (Leaflet map, bundled Bangladesh snapshot, Overpass, Nominatim) replacing Google Maps; no API key or billing.
- Client unit tests with Vitest.
- Input validation with express-validator on all write routes.
- Doctor-to-patient assignment checks on patient, timeline, prescription and lab report access.
- Profile update, password change, forgot and reset password (API and pages).
- Admin user management, system settings and server-side audit log filters.
- Audit events for record reads and refused access; database-enforced append-only audit log.
- Supabase PostgreSQL migrations with Row Level Security on all tables.
- Test suites for security, accounts, admin and clinical workflows (74 tests, 84% line coverage) with a CI coverage gate.

### Changed
- Patient timeline uses one query per table instead of per visit (about 2x faster on Supabase).
- Colour tokens and teal text darkened to meet WCAG 2.1 AA contrast.
- Appointments: patients book and cancel only their own; doctors change only their own.
- Lab uploads check both extension and MIME type and use random file names.

### Fixed
- Admin audit table showed blank timestamp, role, resource and hash columns.
- PostgreSQL transactions were not atomic.
- PostgreSQL counts and timestamps returned in different shapes from SQLite.
- Seed used SQLite-only `INSERT OR IGNORE`.
- Tests wrote into the development database.

See `docs/date-23-oct-26/update-log.md`.
