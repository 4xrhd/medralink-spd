# 🏥 MedraLink Prototype — Full-Stack EMR Management System
**Course:** CSE 416: Software Project Design and Development (SWE – LAB 02)  
**Institution:** University of Information Technology & Sciences (UITS)  
**Instructor:** Dr. Mahfida Amjad Dipa  
**Group:** Group 03  
**Team Members:**  
- **Kazi Md Azhar Uddin Abeer (ID: 0432320005101120)** — *Team Leader & Backend/DB Engineer*  
- **Sabikun Nahar Alina (ID: 0432320005101016)** — *Frontend UI/UX & Integration Engineer*  

---

## 📌 Executive System Overview

MedraLink is an enterprise-grade full-stack Electronic Medical Record (EMR) management platform designed to eliminate healthcare record fragmentation. It unifies patient consultation visits, ICD-10 codified clinical diagnoses, vital signs telemetry, structured digital prescriptions (with PDF export), and diagnostic laboratory reports into a single, continuous **Longitudinal Patient Health Record Timeline**.

### Strict Architectural Boundaries (Proposal Alignment)
- **Classic 3-Tier Architecture:** React 18 SPA (Tailwind CSS) ➔ Node.js/Express.js REST API ➔ Relational Database (3NF Normalized).
- **Explicit Non-Blockchain:** Standard relational transactional engine with append-only SHA-256 cryptographic audit logs. Zero Web3 or cryptocurrency overhead.
- **Workflow Automation Scope:** Dedicated to clinical workflow execution, digital prescriptions, and record retrieval (no automated AI medical diagnosis).

---

## 🔑 Pre-Configured Demo Credentials (1-Click Switcher)

For evaluation and laboratory grading, the web application includes a sticky **1-Click Demo Switcher Bar** at the top of the interface:

| Role | Name & Identifier | Demo Email | Password | Primary Functions |
| :--- | :--- | :--- | :--- | :--- |
| **Doctor** | Dr. Ahmed Tariq (`DOC-2001`) | `dr.ahmed@medralink.com` | `doctor123` | Patient search, consultation workspace, ICD-10 diagnosis, E-prescription builder, PDF generator. |
| **Patient** | Rahim Ahmed (`P-1001`) | `rahim@gmail.com` | `patient123` | Interactive Longitudinal Medical Timeline, digital prescription history, biometric telemetry, lab results. |
| **Administrator** | System Administrator (`ADMIN`) | `admin@medralink.com` | `admin123` | Doctor license verification, patient registry, immutable append-only audit trail inspection. |

---

## 🚀 Quick Start (Zero-Configuration Local Run)

### 1. Start Backend REST API Server
```bash
cd prototype/server

# Install dependencies (already installed)
npm install

# Seed the 15 relational tables with realistic Bangladeshi clinical demo data
npm run seed

# Launch REST API server on Port 5000
npm run dev
```

### 2. Start Frontend Client Application (in a second terminal)
```bash
cd prototype/client

# Install dependencies (already installed)
npm install

# Launch Vite development server on Port 5173
npm run dev
```

Open browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 🧪 Automated Testing & Verification Suite

MedraLink includes automated tests covering authentication, multi-role RBAC authorization guards, atomic consultation transactions, and prescription PDF rendering:

```bash
cd prototype/server
npm test
```

**Test Coverage Summary:**
- `POST /api/v1/auth/login`: Validates password hash verification & JWT issuance.
- `GET /api/v1/auth/me`: Verifies token claims decoding and user context.
- `RBAC Policy Check`: Ensures Patient role receives `403 Forbidden` on Admin audit endpoints.
- `POST /api/v1/consultations`: Verifies atomic multi-table transaction (`medical_records`, `vital_signs`, `diagnoses`, `prescriptions`, `prescription_items`, and `audit_logs`).
- `GET /api/v1/prescriptions/:id/pdf`: Validates dynamic binary PDF rendering.

---

## 🗄️ Relational 3NF Database Schema (15 Tables)

The database schema is defined in [`prototype/server/src/db/schema.sql`](./server/src/db/schema.sql):

1. **`users`**: Base credentials, Bcrypt hash, roles (`ADMIN`, `DOCTOR`, `PATIENT`), status.
2. **`patients`**: Demographics, Blood group, Emergency contact, NID/Birth certificate.
3. **`doctors`**: BMDC medical license number, specialization, qualifications, hospital affiliation.
4. **`appointments`**: Consultation schedule slots, queue status (`SCHEDULED`, `COMPLETED`).
5. **`medical_records`**: Core clinical consultation logs, chief complaints, assessment notes.
6. **`vital_signs`**: Systolic/Diastolic BP, Heart rate, Body temperature, SpO2, Weight, Height, BMI.
7. **`diagnoses`**: Formal ICD-10 codified disease diagnoses with severity and status.
8. **`prescriptions`**: Electronic prescription header with unique `RX-XXXX` identifier.
9. **`prescription_items`**: Dosage, frequency (`1+0+1`), duration, route, and administration instructions.
10. **`lab_reports`**: Diagnostic report documents, results summary, test category.
11. **`documents`**: Medical certificates, discharge slips, and external scans.
12. **`medical_conditions`**: Chronic long-term conditions (e.g., Hypertension, Type 2 Diabetes).
13. **`allergies`**: Known drug and food allergies with severity and adverse reaction details.
14. **`notifications`**: In-app push notifications and consultation alerts.
15. **`audit_logs`**: Immutable append-only audit trail with SHA-256 cryptographic chain.

---

## 🛡️ Core Security Hardening & Data Protection

- **Bcrypt Password Hashing:** Salt rounds $\ge 10$ ensuring credential protection at rest.
- **Stateless JWT Authentication:** Cryptographically signed tokens with 24-hour expiration.
- **Granular RBAC Guards:** Middleware policy guards ensuring Patients access only their own medical data, Doctors access authorized clinical records, and Admins cannot alter clinical consultation notes.
- **SQL Injection Defense:** All queries execute through strictly parameterized queries in Node.js.
- **XSS & HTTP Header Hardening:** Helmet security headers and input sanitization.
- **Append-Only Audit Ledger:** Every state-modifying action records Actor ID, Role, Action, Target Resource, IP Address, Timestamp, and SHA-256 hash.

---

## 🐳 Docker Deployment Option (PostgreSQL 16)

To run the platform containerized with PostgreSQL 16:
```bash
cd prototype
docker compose up --build
```
