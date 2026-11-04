# MedraLink Update Log | 2 to 5 November 2026

Changes to the public website and local development since the 31 October release.

## 1. Summary

| Area | Before | After |
| :--- | :--- | :--- |
| Emergency access | Hospital finder linked only for signed-in patients | Red Emergency button in the header for every visitor and role |
| Visitor help | FAQ section on the landing page only | Help chat on every page for signed-out visitors, English and Bangla |
| Local development | `make dev` used the hosted database and hid demo logins | `make dev` runs on local SQLite with demo accounts |
| Landing footer | Course credit line | Removed |

## 2. Emergency button (3 November)

- `client/src/components/Navbar.tsx`: a red button with an ambulance icon opens `/hospitals`. It shows "Emergency" on tablets and desktops and the icon alone on phones, and turns solid red on the finder page.
- The patient-only "Hospitals" link was removed so the finder is not listed twice.
- Checked with axe (WCAG 2.1 AA): no violations in the header.

## 3. Help chat (5 November)

- `client/src/components/chat/HelpChat.tsx`: the chat window and its "Need help?" button (speech bubble with a medical cross). Hidden once a user signs in. Closes with Escape and returns focus to the button.
- `client/src/components/chat/chatAnswers.ts`: 8 preset questions with answers, English and Bangla keywords, and a fallback reply. Emergency questions always get the 999 and 16263 hotlines first.
- `client/src/i18n/bn.ts`: Bangla text for every question, answer and label.
- Readable sizes: chat text is 15px, question buttons and labels 13px (no 12px text).
- No network requests: answers are fixed text in the page.
- Tests: `chatAnswers.test.ts` (7 tests) covers preset answers, English and Bangla keyword matching, the emergency reply, the fallback, and the no long dash rule. Client total: 38 tests passing.

## 4. Local development (3 November)

- `Makefile`: `make setup`, `make dev`, `make server`, `make client`, `make test`, `make coverage`, `make check`, `make build`, `make reset-db`.
- Always SQLite (`server/data/dev.sqlite`), seeded with the demo accounts on first start, so local runs never touch the hosted Supabase database.
- A busy port stops the command with a suggestion (for example `make dev API_PORT=5051 WEB_PORT=5174`) instead of closing other programs.

## 5. Search suggestions (5 November)

| Search box | Page | Suggests |
| :--- | :--- | :--- |
| City, area or address | Hospital finder | 64 districts and city areas, English or Bangla (`data/places.ts`) |
| ICD-10 diagnosis | New consultation | 80 diagnoses by name or code (`data/icd10.ts`) |
| Medicine name | New consultation | About 60 common brands with generic and strength (`data/medicines.ts`); fills an empty dosage |
| Audit entries | Admin console | 21 audit actions with a plain description (`data/auditActions.ts`) |
| Patients | Doctor dashboard | Live patient results from the API (unchanged) |

- Shared component `client/src/components/SuggestInput.tsx` (ARIA combobox): arrow keys move, Enter picks, Escape closes; free text still works.
- Tests: `data/suggest.test.ts` (8) and `data/icd10.test.ts` (5). Client total: 51 passing. axe: no violations on New consultation.

## 6. Patient test report upload (5 November)

Requested by the course teacher: patients upload test reports, and their doctors can see them at any time.

| Part | What changed |
| :--- | :--- |
| Who can upload | Patients (own record only), doctors (assigned patients), admins. A patient's upload must include a file. |
| Formats | PDF, JPG, PNG, WebP; up to 10 MB in the form (the admin setting `max_upload_mb` still applies on the server). Extension, MIME type and the file's first bytes are all checked. |
| Where it shows | "Test reports" card on the patient timeline (`client/src/components/TestReportsCard.tsx`), replacing the old read-only lab archive card. Patients get an upload form; doctors get the list with an open button per file. |
| Opening files | The file is fetched with the session token and opened in a new tab, so the token never appears in a URL. Each open is audited as `VIEW_LAB_REPORT_FILE`. |
| Storage | `server/src/services/fileStorage.ts`: a private Supabase Storage bucket when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (production on Render), otherwise `server/uploads/`. The bucket is created on first upload. The API streams the file after its access check; browsers never get a bucket link. |

Before deploying: add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the Render dashboard (both are listed in `render.yaml` and `server/.env.example`). Without them the upload still works on Render but files are lost on the next restart.

Tests: 4 new storage tests and 3 upload permission tests on the server (146 passing), 4 file-check tests on the client (55 passing).

