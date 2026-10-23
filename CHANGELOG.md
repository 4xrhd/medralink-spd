# Changelog

All notable changes to MedraLink. Detailed notes per date live in `docs/date-*/update-log.md`.

## 2026-10-23

### Added
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
