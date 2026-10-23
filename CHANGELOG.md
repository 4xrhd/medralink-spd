# Changelog

All notable changes to MedraLink. Detailed notes per date live in `docs/date-*/update-log.md`.

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
