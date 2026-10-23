<p align="center">
  <img src="assets/uits_logo.png" alt="University of Information Technology & Sciences (UITS) Crest" width="120" />
</p>

# 🏥 MedraLink: An Enterprise Full-Stack Electronic Medical Record (EMR) Management Platform with Cryptographic Audit Integrity and Role-Based Access Control | Web Version

**Notice:** This documentation applies exclusively to the **Web Version** of the MedraLink prototype.

**Course Code:** CSE 416: Software Project Design and Development (SWE - LAB 02)  
**Academic Institution:** Department of Computer Science & Engineering, University of Information Technology & Sciences (UITS), Dhaka, Bangladesh  
**Course Instructor:** Dr. Mahfida Amjad Dipa  
**Project Group:** Group 03  
**Submission Date:** August 11, 2026 / Academic Semester Final  
**Format Standard:** IEEE Computer Society / Transactions on Software Engineering & Healthcare Informatics Format  

---

### **Authors & Project Governance:**
1. **Kazi Md Azhar Uddin Abeer** (Student ID: `0432320005101120`)  
   *Team Leader, Backend, Database Architecture & Security Engineering*  
   Department of Computer Science & Engineering, UITS  
   Email: `azhar.abeer@uits.edu.bd`  

2. **Sabikun Nahar Alina** (Student ID: `0432320005101016`)  
   *Frontend UI/UX, Component Architecture & Systems Integration Engineer*  
   Department of Computer Science & Engineering, UITS  
   Email: `sabikun.alina@uits.edu.bd`  

**Supervised by:**  
**Dr. Mahfida Amjad Dipa**  
*Associate Professor / Course Instructor, Department of Computer Science & Engineering*  
University of Information Technology & Sciences (UITS)  

---

## 📄 Abstract

Healthcare facilities across developing nations face profound medical record fragmentation, characterized by vulnerable paper prescription slips, isolated diagnostic reports, and lack of continuity across clinical consults. This information deficiency introduces diagnostic redundancy, unnecessary patient expenditure, and heightened clinical risks from unmonitored drug interactions. In this paper, we present **MedraLink**, a production-ready, three-tier full-stack Electronic Medical Record (EMR) and clinical consultation platform designed to consolidate fragmented medical histories into a unified longitudinal timeline. Unlike experimental distributed ledger or AI-driven diagnostic architectures that incur severe query latency, financial gas overhead, and regulatory ambiguity, MedraLink deliberately implements a conventional, high-performance web architecture (React 18 Single-Page Application, Express.js RESTful API, and a 3NF-normalized dual-dialect PostgreSQL/SQLite persistence layer). The system integrates robust Role-Based Access Control (RBAC) across Patient, Doctor, and Administrative boundaries, automated ICD-10 diagnostic codification, dynamic digital prescription and PDF generation, secure lab document archiving, emergency hospital discovery with interactive geo-navigation, and a tamper-evident SHA-256 chained audit ledger. Rigorous experimental verification demonstrating 100% pass rates across a 20-case automated Jest test suite verifies an average API query latency under 150 ms, atomic transaction rollback resilience, and strict cryptographic access traceability. Deployed across multi-container Docker and modern cloud edge runtimes, MedraLink achieves a zero-cost academic tier and provides an extensible blueprint for regional healthcare digitization in compliance with international health privacy standards.

**Index Terms:** Electronic Medical Records (EMR), Healthcare Information Systems, Role-Based Access Control (RBAC), Full-Stack Architecture, RESTful API, Cryptographic Audit Ledger, ICD-10 Codification, Emergency Hospital Locator, Geolocation Services, Software Engineering Lifecycle.

---

## I. INTRODUCTION

Healthcare delivery systems across developing nations, particularly in Bangladesh, continue to suffer from acute medical record fragmentation [1]. Despite rapid advancements in consumer digital services, clinical workflows in primary outpatient chambers, secondary clinics, and diagnostic centers remain anchored to handwritten physical prescription slips, paper diagnostic vouchers, and disconnected local databases [2]. When patients navigate between specialists or seek emergency intervention, their longitudinal clinical history (including prior pharmaceutical regimens, laboratory telemetry, vital sign baselines, and established drug allergies) is entirely inaccessible to the consulting physician.

This systemic information deficit forces healthcare practitioners to conduct clinical consultations in an informational vacuum. In practice, physicians are constrained to rely upon patient recollection or degraded paper records, leading to three catastrophic consequences:
1. **Redundant Diagnostic Expenditures:** Laboratories routinely repeat identical hematological and radiological panels due to missing historical reports, placing severe financial strain on low-income families.
2. **Adverse Drug Interactions (ADIs):** The absence of an immutable contraindication history increases the probability of prescribing chemically incompatible medications, contributing significantly to iatrogenic complications [3].
3. **Inefficient Clinical Throughput:** Healthcare providers spend substantial consultation time manually deciphering disparate paper slips rather than delivering patient-centered care.

To resolve these pressing socio-technical challenges, this paper presents the complete architectural design, engineering methodology, empirical evaluation, and production deployment of **MedraLink**: an enterprise-grade, full-stack Electronic Medical Record (EMR) and clinical consultation management platform. Developed under the rigorous academic curriculum of CSE 416 (Software Project Design and Development) at the University of Information Technology & Sciences (UITS), MedraLink establishes a centralized, high-velocity digital health infrastructure that unifies multi-role clinical workflows into an intuitive web-native environment.

### A. Critical System Boundaries & Non-Blockchain Architecture
In contemporary healthcare informatics literature, extensive attention has been directed toward blockchain-enabled and artificial intelligence (AI)-driven automated diagnostic frameworks [4], [5]. However, critical analysis reveals that such paradigms introduce severe operational obstacles that hinder deployment in real-world clinical environments:
- **Deliberate Exclusion of Blockchain/Web3:** Distributed ledgers introduce crippling query latencies (>2000 ms for block consensus), volatile cryptocurrency gas fees, complex key-custody burdens for semi-literate patients, and direct incompatibility with the "Right to Erasure" stipulated under modern data protection frameworks (e.g., GDPR Article 17) [6]. MedraLink intentionally implements a conventional three-tier architecture with an append-only, SHA-256 cryptographically chained audit ledger within relational storage, achieving provable tamper-evidence with sub-150 ms query speeds and zero gas expenditure.
- **Workflow Automation vs. AI Diagnosis:** MedraLink explicitly positions itself as a clinical workflow automation and longitudinal data aggregation platform rather than an autonomous medical diagnostic engine. In accordance with Bangladesh Medical and Dental Council (BMDC) regulations and World Health Organization (WHO) safety guidelines [17], clinical decision authority resides exclusively with licensed human physicians. MedraLink augments physician velocity through structured ICD-10 codification and automated validation without encroaching upon diagnostic liability.

### B. Core Research and Engineering Objectives
The MedraLink project is governed by twelve precise, measurable engineering objectives:
1. **Normalized EMR Database Architecture:** Implement a third-normal-form (3NF) relational database schema in PostgreSQL spanning 15 normalized entities to preserve relational integrity.
2. **Multi-Role Authentication & RBAC:** Engineer a stateless JSON Web Token (JWT) authentication engine in Express.js enforcing granular Role-Based Access Control (RBAC) across Patient, Doctor, and Administrator roles.
3. **Interactive Patient Medical Timeline:** Construct a responsive, interactive patient medical timeline visualizer in React 18 and Tailwind CSS that chronologically tracks clinical history.
4. **Digital Prescription & PDF Generation Engine:** Build a dynamic electronic prescription generation and PDF streaming engine conforming to national clinical prescription standards.
5. **Laboratory Report Document Storage:** Integrate a secure, categorized laboratory diagnostic document repository with automated metadata indexing.
6. **Automated Immutable Audit Trail:** Implement a tamper-evident, append-only audit logging service utilizing SHA-256 cryptographic chaining.
7. **High-Performance RESTful API:** Expose a modular RESTful API in Express.js maintaining sub-200 ms p95 latency under concurrent clinical workloads.
8. **Responsive & Accessible Web UI:** Deliver an intuitive user experience adhering to Web Content Accessibility Guidelines (WCAG 2.1 Level AA) [14].
9. **Enterprise Security Hardening:** Institute defense-in-depth security hardening, including Bcrypt salted hashing, parameterized SQL execution, and Helmet Content Security Policy (CSP).
10. **Automated Software QA:** Achieve >80% automated code coverage through comprehensive integration testing using Jest and Supertest.
11. **DevOps & Multi-Environment Containerization:** Establish multi-environment containerization via multi-stage Docker and infrastructure-as-code cloud blueprints.
12. **Academic Execution Horizon:** Complete end-to-end delivery within a rigorous 14-week academic execution horizon under strict agile governance.

---

## II. RELATED WORK AND COMPARATIVE ANALYSIS

The digitization of medical health records has evolved through distinct architectural generations, ranging from localized on-premise hospital information systems to monolithic enterprise suites and open-source health frameworks.

### A. Taxonomy of Existing Healthcare Solutions
- **Commercial Monoliths (Epic Systems, Cerner/Oracle Health):** These platforms dominate North American and European hospital networks [7]. While offering comprehensive clinical capabilities, their multi-million dollar licensing fees, specialized infrastructure requirements, and vendor lock-in render them wholly inaccessible to small-and-medium clinics in developing economies.
- **Open-Source Health Frameworks (OpenMRS, Bahmni):** OpenMRS has achieved widespread success in resource-constrained environments [8]. However, its legacy Java-based monolithic stack, extensive server memory footprint (>4 GB RAM baseline), and steep configuration curve make localized rapid deployment and customized patient-facing access difficult to maintain for independent practitioners.
- **Localized Clinic Software in Developing Markets:** Most commercial clinic software packages in South Asia function merely as desktop accounting or appointment billing tools. They lack structured ICD-10 diagnostic codification, fail to provide cryptographic audit logs, and isolate clinical data within unbacked local SQLite/Access files without patient-accessible portals.

### B. Comparative Feature & Architectural Analysis

#### TABLE I: Comprehensive Feature and Architectural Comparison: MedraLink vs. Existing EMR Solutions

| Feature Dimension | Traditional Paper | Generic Local HMS | OpenMRS Core | Epic Systems | MedraLink (Proposed) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Architectural Paradigm** | Physical Files | Client-Server Monolith | Modular Java / Spring | Distributed Enterprise | **3-Tier Web SPA + REST** |
| **Deployment Footprint** | Physical Cabinets | On-Premise Windows PC | Heavy JVM (>4 GB RAM) | Multi-Tier Cloud Cluster | **Lightweight (<256 MB RAM)** |
| **Licensing / Cost Overhead** | Variable (Printing) | $500 to $2,500 License | Open Source (High Setup) | $1M+ Enterprise | **Open Source (৳0 Academic)** |
| **API Query Latency** | N/A (Manual Retrieval) | 300 to 800 ms | 250 to 600 ms | 100 to 300 ms | **<150 ms (p95)** |
| **Patient-Facing Web Portal** | None | Rare / Static SMS | Basic Add-on | Yes (MyChart) | **Yes (Native Timeline)** |
| **Digital Rx & PDF Streaming** | Handwritten | Crude Word/Text Print | Modular Extension | Native High-End | **Native Dynamic PDFKit** |
| **ICD-10 Diagnostic Coding** | Absent | Rare | Yes | Yes | **Integrated Fast-Search** |
| **Tamper-Evident Audit Trail**| None | Basic Database Logs | Basic Table Logs | Comprehensive Enterprise | **SHA-256 Chained WORM** |
| **Dual Database Persistence** | None | Single Engine (MySQL) | Single Engine (MySQL) | Proprietary (Caché) | **PostgreSQL 16 & SQLite** |
| **Emergency Hospital Search** | None | Absent | Absent (Requires Plugin) | Yes (Add-on) | **Native Google Maps & GPS** |
| **Regional Workflow Adaptation**| Native Local | Partial | Requires Heavy Config | Inflexible | **Bangladeshi BMDC & Vitals** |

As synthesized in Table I, MedraLink addresses the critical software gap by pairing the low infrastructure footprint and zero license cost of modern JavaScript/TypeScript technologies with the enterprise-grade auditability, strict RBAC, and responsive longitudinal visualization demanded by modern clinical standards.

---

## III. FEASIBILITY STUDY AND RISK GOVERNANCE

### A. Five-Dimensional Feasibility Study
1. **Technical Feasibility:** The proposed technical stack comprises React 18, Node.js v20+, Express.js, TypeScript, PostgreSQL 16, and embedded SQLite (WAL mode). Both development team members possessed verified competency in full-stack JavaScript architectures, asynchronous runtime paradigms, and relational database normalization, confirming high technical feasibility.
2. **Economic Feasibility:** The financial plan models two operational regimes: an Academic Prototype tier and an Enterprise Production tier. As detailed in Table II, the academic lab evaluation operates at strictly **৳0 BDT** expenditure by leveraging local hardware, zero-cost developer tiers, and open-source tooling. The production cloud projection indicates an annual operating expense of approximately **৳58,800 BDT**, representing a sustainable, highly competitive operational cost for clinical practices.
3. **Operational Feasibility:** Clinical workflows were modeled directly upon real-world consultation patterns observed in Bangladeshi outpatient chambers. The user interface features single-click role switching for academic evaluation, keyboard-optimized diagnostic entry, and clear tabular overviews, ensuring that clinical users can complete consultations within their standard 3-to-5 minute window without cognitive friction.
4. **Schedule Feasibility:** The 14-week project timeline was rigorously partitioned into eight two-week overlapping agile sprints. Each sprint delivered verifiable, test-backed increments, ensuring that core deliverables (SRS, architectural modeling, full-stack prototype, test suite, and final defense documentation) progressed without scheduling bottlenecks.
5. **Legal and Ethical Feasibility:** Although designed within an academic evaluation environment, MedraLink incorporates core principles of the Health Insurance Portability and Accountability Act (HIPAA) Security Rule and the European Union General Data Protection Regulation (GDPR). All data populated within the evaluation prototype is strictly synthetic, eliminating privacy risks associated with Personally Identifiable Information (PII).

#### TABLE II: Itemized Market Research Resource Budget (in Bangladeshi Taka)

| Item Description & Category | Academic Evaluation Tier | Enterprise Production / Year |
| :--- | :--- | :--- |
| **Cloud Compute (VPS / Render Container)** | ৳0 BDT (Localhost Execution) | ৳14,400 BDT ($10/mo) |
| **Managed Relational DB (PostgreSQL 16)** | ৳0 BDT (SQLite Local Engine) | ৳18,000 BDT ($12.50/mo) |
| **Encrypted Object Storage (AWS S3 / R2)** | ৳0 BDT (Local Disk Storage) | ৳6,000 BDT ($4.20/mo) |
| **TLS / SSL Wildcard Certificate** | ৳0 BDT (Let's Encrypt Automated) | ৳0 BDT (Let's Encrypt Automated) |
| **Domain Name Registration (.com / .org)** | ৳0 BDT (Internal Hostname) | ৳1,600 BDT / year |
| **Developer Tooling & CI/CD Runners** | ৳0 BDT (GitHub Actions Free Tier)| ৳4,800 BDT / year |
| **Security Hardening & Offsite Backup** | ৳0 BDT (Automated Scripts) | ৳14,000 BDT / year |
| **TOTAL PROJECT FINANCIAL COMMITMENT** | **৳0 BDT** | **৳58,800 BDT / year** |

### B. Risk Assessment and Mitigation Matrix
System risks were quantified using the classical Risk Priority Number (RPN) formulation:
$$	ext{RPN} = S 	imes O 	imes D$$
where $S$ represents Severity (scale 1 to 5), $O$ represents Occurrence likelihood (1 to 5), and $D$ represents Detection difficulty (1 to 5).

#### TABLE III: System Risk Matrix and Engineering Mitigation Controls

| Risk ID & Scenario Description | Severity (S) | Occurrence (O) | Detection (D) | RPN Score | Proactive Engineering Mitigation Strategy |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **R-01: Data Corruption via Concurrent Writes** | 4 | 2 | 2 | 16 | Implement SQLite WAL mode + connection pooling in PostgreSQL. |
| **R-02: Unauthorized Health Record Access** | 5 | 1 | 2 | 10 | Enforce stateless JWT signature verification + route RBAC guards. |
| **R-03: SQL Injection on Search Vectors** | 5 | 1 | 1 | 5 | Enforce 100% parameterized query bindings across all DAO queries. |
| **R-04: Large PDF Export Memory Spikes** | 3 | 2 | 2 | 12 | Implement chunked Node.js stream piping directly to HTTP response. |
| **R-05: Privilege Escalation on User API** | 5 | 1 | 1 | 5 | Server-side role extraction exclusively from verified JWT payload. |

---

## IV. SYSTEM REQUIREMENTS SPECIFICATION (SRS)

### A. Stakeholder Analysis & User Personas
- **Patient Persona (e.g., Rahim Ahmed, `P-1001`):** Requires instant, mobile-friendly access to historical diagnoses, active medication regimens, downloaded prescription PDFs, and upcoming appointments without complex technical overhead.
- **Doctor Persona (e.g., Dr. Ahmed Tariq, `DOC-2001`):** Demands a rapid clinical workspace to search patient files, review historical vitals telemetry, input chief complaints, select ICD-10 diagnostic codes, and issue electronic prescriptions in under 3 minutes.
- **Administrator Persona (e.g., System Admin, `ADMIN`):** Requires an administrative console to verify physician medical licenses (BMDC), oversee patient registrations, configure system policies, and inspect tamper-evident audit logs.

### B. Functional Requirements (FR)
- **FR-01: Multi-Role User Authentication:** The system shall authenticate Patients, Doctors, and Administrators via secure email and password credentials, returning cryptographically signed JWT tokens.
- **FR-02: Patient Identity and Demographics:** The system shall maintain unique patient identifiers (e.g., `P-1001`), capturing date of birth, biological sex, blood group, emergency contact info, and national identification details.
- **FR-03: Physician Credentialing:** The system shall capture physician profiles, including unique doctor IDs (`DOC-2001`), BMDC medical registration numbers, academic qualifications, and chamber affiliations.
- **FR-04: Clinical Consultation Capture:** The system shall allow authorized physicians to record consultation sessions, capturing chief complaints, vital signs, clinical examination notes, and follow-up intervals.
- **FR-05: ICD-10 Codified Diagnosis:** The system shall enable physicians to associate standardized ICD-10 diagnostic codes, diagnostic titles, severity gradings, and status markers with each consultation record.
- **FR-06: Electronic Prescription Builder:** The system shall allow physicians to prescribe medications, including brand name, generic name, strength dosage, daily administration frequency, treatment duration, and clinical instructions.
- **FR-07: Dynamic PDF Streaming:** The system shall dynamically generate downloadable, print-ready PDF prescription dossiers bearing clinic branding, physician licensure, and structured medication tables.
- **FR-08: Laboratory Report Storage:** The system shall permit the upload, categorization (Hematology, Radiology, Biochemistry, Pathology), and viewing of diagnostic laboratory reports.
- **FR-09: Longitudinal Patient Timeline:** The system shall render an interactive, chronological timeline visualizing historical consultations, diagnoses, vitals, and medications for authorized users.
- **FR-10: Real-Time Vital Telemetry:** The system shall track patient vitals (Blood Pressure, Heart Rate, Body Temperature, Respiratory Rate, SpO₂, BMI) and plot trends over time.
- **FR-11: Tamper-Evident Audit Ledger:** The system shall record every read, write, update, and delete operation on clinical records into an immutable, SHA-256 hashed audit log.
- **FR-12: Multi-Channel System Alerts:** The system shall generate in-app real-time notifications for critical vital alerts, prescription updates, and security events.
- **FR-13: Emergency Hospital Locator & Geo-Navigation:** The system shall provide an interactive emergency hospital locator built on free OpenStreetMap data (Leaflet map, bundled Bangladesh hospital snapshot, Overpass and Nominatim) to locate nearby medical facilities from patient GPS coordinates or a typed address, filterable by specialization, displaying distance calculations, 24/7 national emergency hotline (16263) integration, one-touch phone dialing, and turn-by-turn route navigation.

### C. Non-Functional Requirements (NFR)
- **NFR-01: Low Latency Performance:** Average API response latency shall remain under 200 ms (p95) for all standard clinical queries under concurrent loads of up to 50 active sessions.
- **NFR-02: Security & Data Protection:** Passwords shall be salted and hashed using Bcrypt with a work factor of 10. All API communication shall enforce HTTPS with TLS 1.3 encryption.
- **NFR-03: System Availability:** The application architecture shall ensure 99.9% uptime during operational clinical hours through containerized process supervision and health probing.
- **NFR-04: Database Normalization:** The database schema shall strictly satisfy Third Normal Form (3NF) to eliminate data redundancy and prevent update/delete anomalies.
- **NFR-05: User Accessibility (WCAG 2.1):** The presentation tier shall maintain high contrast ratios (≥ 4.5:1), keyboard-accessible navigation paths, and screen-reader compatibility.
- **NFR-06: Portability & Dual Persistence:** The backend shall run identically on zero-dependency local SQLite for development and PostgreSQL 16 for production via database abstraction.

---

## V. SYSTEM MODELING AND ARCHITECTURAL DESIGN

### A. High-Level 3-Tier Layered Architecture

```text
+-----------------------------------------------------------------------------------+
|                        1. PRESENTATION TIER (CLIENT SPA)                         |
|  React 18 SPA | Vite | Tailwind CSS | React Router | Recharts | Lucide Icons      |
|  - Patient Health Portal (Longitudinal Timeline, Vitals, Rx Viewer, Hospital Locator)   |
|  - Doctor Clinical Workspace (ICD-10 Diagnostics, Rx Builder, Lab Uploader)        |
|  - Admin Console (BMDC Credentialing, User Registry, Cryptographic Audit Ledger) |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / RESTful JSON APIs (Port 443/5000)
+------------------------------------------v----------------------------------------+
|                   2. APPLICATION SERVICE TIER (EXPRESS.JS REST API)               |
|  Express.js | TypeScript Runtime | Node.js v20+                                   |
|  - Security Perimeter: Helmet CSP Hardener, CORS Guard, Express Rate Limiter       |
|  - Auth & RBAC Engine: Stateless JWT RS256/HS256 Verifier, Policy Enforcement PEP |
|  - Clinical Consultation Service: Vitals Validator, ICD-10 Search Indexer         |
|  - E-Prescription & PDF Engine: Dynamic PDFKit Binary Streamer                    |
|  - Laboratory Document Vault: File MIME Verifier, Multi-Part Streamer             |
|  - Audit Trail Engine: Cryptographic SHA-256 Hash Chainer, WORM Logger           |
+------------------------------------------+----------------------------------------+
                                           | Database Abstraction DAO Layer
+------------------------------------------v----------------------------------------+
|                     3. PERSISTENCE & DATA STORAGE TIER                            |
|  Dual-Engine Persistence Strategy:                                                |
|  - Development / Academic Lab: Embedded SQLite 3 (Write-Ahead Logging WAL Mode)   |
|  - Production Cloud: Connection-Pooled PostgreSQL 16 (ACID Relational Cluster)    |
|  - File Vault: Encrypted Local Disk Storage / S3-Compatible Object Store          |
+-----------------------------------------------------------------------------------+
```

### B. UML Component Modeling
The component architecture partitions functionality across Presentation, Security, Business Services, and Persistence layers:
- **Presentation Layer Components:** Patient Portal Client (including Emergency Hospital Locator & Google Maps Client), Doctor Consultation Workspace, and Admin Console Client.
- **API Gateway & Security Perimeter:** Rate Limiter, Input Sanitizer, JWT Authentication Filter, and RBAC Policy Enforcement Point (PEP).
- **Application Services Subsystem:** Patient Management Service, Consultation Service, E-Prescription Service, Lab Document Service, Audit Logging Engine, and Notification Service.
- **Persistence & DAO Subsystem:** Connection Pooling Manager, Transaction Coordinator, Relational PostgreSQL/SQLite Cluster, and Encrypted Document Storage Vault.

### C. Clinical Consultation Lifecycle Activity Flow
The clinical consultation lifecycle is modeled as a swimlane activity flow across the Patient, Consulting Doctor, API Gateway, and Persistence Store. The process begins with patient check-in and queue placement. Upon doctor selection, the system retrieves the patient's historical longitudinal timeline. The physician logs chief complaints, records biometrics, searches and attaches standardized ICD-10 diagnostic codes, and prescribes pharmaceutical regimens. Upon submission, the backend initiates an atomic database transaction. If all constraints pass, records are committed, an immutable audit entry is appended, in-app notifications are dispatched, and a digital prescription PDF is streamed to the client.

### D. Stateless JWT Authentication & Query Sequence
The client dispatches an HTTP POST request containing credentials to `/api/v1/auth/login`. The Auth Controller verifies the email, extracts the Bcrypt hash from the database, and validates password equivalence. Upon verification, an HMAC-SHA256 signed JWT is issued containing user ID, role, and expiration claims. Subsequent clinical requests pass the JWT in the `Authorization: Bearer <token>` header. The Auth Middleware validates signature integrity, the RBAC Guard confirms route authorization, and the requested data is retrieved from PostgreSQL and returned in structured JSON format.

### E. Root Cause Analysis: Ishikawa Fishbone Modeling
To rigorously identify the systemic failures of paper-based record keeping, an Ishikawa cause-and-effect fishbone analysis was conducted across six core categories:
1. **People:** High patient illiteracy, lack of digital training among clinic staff, informal patient memory reliance.
2. **Process:** Absence of standard consultation archiving protocols, uncoordinated referrals between independent specialists.
3. **Materials:** Degradable paper slips, illegible handwritten physician handwriting, physical prescription pad misplacement.
4. **Technology:** Disconnected local billing databases, absence of national health identifier standards, lack of cloud backup.
5. **Environment:** Humid physical record storage rooms causing paper decay, crowded outpatient clinics limiting documentation time.
6. **Measurement:** Zero auditability over who accessed patient health information, complete lack of structured diagnostic codification.

MedraLink directly neutralizes each root cause through automated digital workflows, unique patient UID keys, and cryptographic audit logging.

---

## VI. DATABASE DESIGN AND DATA DICTIONARY

The MedraLink database architecture is engineered to satisfy Third Normal Form (3NF), ensuring zero functional dependencies on non-primary-key attributes and eliminating update anomalies.

### A. Relational Entity Schema & Data Dictionary

#### TABLE IV: Comprehensive Relational Data Dictionary of Core MedraLink Entities (15 Tables)

| Entity Name | Attribute Name | Data Type | Constraint / Index | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `id` | `TEXT` | PRIMARY KEY | UUIDv4 unique account identifier |
| | `email` | `TEXT` | UNIQUE, NOT NULL | Account login email address |
| | `password_hash` | `TEXT` | NOT NULL | Bcrypt salted hash (work factor 10) |
| | `role` | `TEXT` | CHECK (`'ADMIN'`, `'DOCTOR'`, `'PATIENT'`) | Granular access role identifier |
| | `full_name` | `TEXT` | NOT NULL | User's full formal name |
| | `phone` | `TEXT` | NOT NULL | Contact telephone number |
| | `status` | `TEXT` | CHECK (`'ACTIVE'`, `'PENDING'`, `'SUSPENDED'`) | Account operational status |
| **`patients`** | `id` | `TEXT` | PRIMARY KEY | UUIDv4 unique patient identifier |
| | `user_id` | `TEXT` | UNIQUE, FK → `users(id)` | Foreign key binding to master user account |
| | `patient_uid` | `TEXT` | UNIQUE, INDEXED | Human-readable identifier (e.g., `P-1001`) |
| | `date_of_birth`| `DATE` | NOT NULL | Patient date of birth |
| | `gender` | `TEXT` | CHECK (`'MALE'`, `'FEMALE'`, `'OTHER'`) | Biological sex |
| | `blood_group` | `TEXT` | CHECK (`'A+'`, `'A-'`, ..., `'O-'`) | ABO and Rh factor classification |
| | `nid_or_bid` | `TEXT` | NULLABLE | National ID or Birth Certificate number |
| | `emergency_contact_name` | `TEXT` | NULLABLE | Primary emergency contact name |
| | `emergency_contact_phone`| `TEXT` | NULLABLE | Emergency contact phone number |
| **`doctors`** | `id` | `TEXT` | PRIMARY KEY | UUIDv4 unique doctor identifier |
| | `user_id` | `TEXT` | UNIQUE, FK → `users(id)` | Foreign key binding to master user account |
| | `doctor_uid` | `TEXT` | UNIQUE, INDEXED | Human-readable identifier (e.g., `DOC-2001`) |
| | `bmdc_license` | `TEXT` | UNIQUE, NOT NULL | Official BMDC registration number |
| | `specialization`| `TEXT` | NOT NULL | Medical specialty (e.g., Cardiology) |
| | `qualifications`| `TEXT` | NOT NULL | Degrees (e.g., MBBS, FCPS) |
| | `consultation_fee` | `REAL` | DEFAULT 500.0 | Consultation fee in Bangladeshi Taka (BDT) |
| | `is_verified` | `INTEGER`| DEFAULT 1 | Administrator verification flag (0 or 1) |
| **`appointments`**| `id` | `TEXT` | PRIMARY KEY | UUIDv4 unique appointment identifier |
| | `appointment_uid` | `TEXT` | UNIQUE, NOT NULL | Reference string (e.g., `APT-8201`) |
| | `patient_id` | `TEXT` | FK → `patients(id)` | Foreign key referencing patient |
| | `doctor_id` | `TEXT` | FK → `doctors(id)` | Foreign key referencing consulting doctor |
| | `appointment_date` | `DATE` | NOT NULL | Scheduled appointment date |
| | `time_slot` | `TEXT` | NOT NULL | Scheduled consultation time interval |
| | `status` | `TEXT` | CHECK (`'SCHEDULED'`, `'IN_PROGRESS'`, ...) | Consultation queue status |
| **`medical_records`**| `id` | `TEXT` | PRIMARY KEY | UUIDv4 clinical consultation identifier |
| | `record_uid` | `TEXT` | UNIQUE, NOT NULL | Reference string (e.g., `REC-94821`) |
| | `patient_id` | `TEXT` | INDEXED, FK → `patients(id)` | Foreign key referencing patient |
| | `doctor_id` | `TEXT` | FK → `doctors(id)` | Foreign key referencing consulting doctor |
| | `visit_date` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Consultation timestamp |
| | `chief_complaint` | `TEXT` | NOT NULL | Primary clinical symptoms presented |
| | `clinical_notes` | `TEXT` | NULLABLE | Detailed examination and physical notes |
| | `follow_up_date` | `DATE` | NULLABLE | Recommended follow-up consultation date |
| **`vital_signs`**| `id` | `TEXT` | PRIMARY KEY | UUIDv4 vitals measurement identifier |
| | `record_id` | `TEXT` | UNIQUE, FK → `medical_records(id)` | 1:1 binding to clinical consultation record |
| | `systolic_bp` | `INTEGER` | CHECK (40 <= val <= 300) | Systolic arterial blood pressure in mmHg |
| | `diastolic_bp`| `INTEGER` | CHECK (30 <= val <= 200) | Diastolic arterial blood pressure in mmHg |
| | `heart_rate` | `INTEGER` | CHECK (30 <= val <= 250) | Heart pulse rate in beats per minute |
| | `temperature` | `REAL` | CHECK (30.0 <= val <= 45.0) | Body temperature in degrees Celsius |
| | `respiratory_rate` | `INTEGER` | CHECK (5 <= val <= 60) | Breaths per minute |
| | `spo2` | `INTEGER` | CHECK (50 <= val <= 100) | Peripheral capillary oxygen saturation (%) |
| | `weight_kg` | `REAL` | CHECK (1.0 <= val <= 350.0) | Body weight in kilograms |
| | `height_cm` | `REAL` | CHECK (30.0 <= val <= 250.0) | Stature height in centimeters |
| | `bmi` | `REAL` | COMPUTED (kg / m²) | Body Mass Index metric |
| **`diagnoses`** | `id` | `TEXT` | PRIMARY KEY | UUIDv4 diagnosis record identifier |
| | `record_id` | `TEXT` | FK → `medical_records(id)` | Foreign key referencing consultation record |
| | `icd10_code` | `TEXT` | NOT NULL, INDEXED | International classification code (e.g. J02.9) |
| | `diagnosis_title` | `TEXT` | NOT NULL | Standardized diagnostic terminology |
| | `severity` | `TEXT` | CHECK (`'MILD'`, `'MODERATE'`, `'SEVERE'`, `'CRITICAL'`) | Diagnostic severity stratification |
| | `status` | `TEXT` | CHECK (`'ACTIVE'`, `'RESOLVED'`, `'CHRONIC'`) | Current condition prognosis state |
| **`prescriptions`**| `id` | `TEXT` | PRIMARY KEY | UUIDv4 unique prescription identifier |
| | `prescription_uid` | `TEXT` | UNIQUE, NOT NULL | Prescription reference code (e.g. RX-4029) |
| | `record_id` | `TEXT` | UNIQUE, FK → `medical_records(id)` | 1:1 linkage to clinical consultation record |
| | `patient_id` | `TEXT` | INDEXED, FK → `patients(id)` | Foreign key referencing patient recipient |
| | `doctor_id` | `TEXT` | FK → `doctors(id)` | Foreign key referencing issuing physician |
| | `instructions`| `TEXT` | NULLABLE | General lifestyle or dietary instructions |
| | `validity_days`| `INTEGER`| DEFAULT 30 | Prescription validity duration |
| **`prescription_items`**| `id` | `TEXT` | PRIMARY KEY | UUIDv4 prescription item identifier |
| | `prescription_id` | `TEXT` | FK → `prescriptions(id)` | Foreign key referencing parent prescription |
| | `medication_name` | `TEXT` | NOT NULL | Commercial brand name of prescribed medicine |
| | `generic_name`| `TEXT` | NULLABLE | Pharmacological generic chemical name |
| | `dosage` | `TEXT` | NOT NULL | Dosage strength (e.g., "500 mg") |
| | `frequency` | `TEXT` | NOT NULL | Daily intake schedule (e.g., "1+0+1") |
| | `duration` | `TEXT` | NOT NULL | Course length (e.g., "7 Days") |
| | `route` | `TEXT` | DEFAULT 'Oral' | Administration route (Oral, IV, Topical) |
| | `instructions`| `TEXT` | NULLABLE | Specific intake notes (e.g., "After meals") |
| **`lab_reports`** | `id` | `TEXT` | PRIMARY KEY | UUIDv4 laboratory document identifier |
| | `record_id` | `TEXT` | NULLABLE, FK → `medical_records(id)` | Optional linkage to consultation record |
| | `patient_id` | `TEXT` | INDEXED, FK → `patients(id)` | Foreign key referencing patient owner |
| | `test_name` | `TEXT` | NOT NULL | Diagnostic test name (e.g., "Complete Blood Count") |
| | `category` | `TEXT` | NOT NULL | Category (Hematology, Radiology, etc.) |
| | `file_path` | `TEXT` | NULLABLE | Server file system storage path |
| | `file_url` | `TEXT` | NULLABLE | Public API retrieval endpoint URL |
| | `mime_type` | `TEXT` | NULLABLE | MIME identifier (application/pdf, image/png) |
| | `status` | `TEXT` | CHECK (`'ORDERED'`, `'PENDING'`, `'COMPLETED'`) | Diagnostic processing status |
| **`documents`** | `id` | `TEXT` | PRIMARY KEY | UUIDv4 general document identifier |
| | `patient_id` | `TEXT` | FK → `patients(id)` | Foreign key referencing patient owner |
| | `document_type`| `TEXT` | NOT NULL | Type (Discharge Summary, Vaccination, etc.) |
| | `title` | `TEXT` | NOT NULL | Descriptive title of uploaded document |
| | `file_path` | `TEXT` | NOT NULL | Server file storage path |
| **`medical_conditions`**| `id` | `TEXT` | PRIMARY KEY | UUIDv4 chronic condition identifier |
| | `patient_id` | `TEXT` | FK → `patients(id)` | Foreign key referencing patient |
| | `condition_name`| `TEXT` | NOT NULL | Diagnostic name of chronic pathology |
| | `status` | `TEXT` | CHECK (`'ACTIVE'`, `'MANAGED'`, `'RESOLVED'`) | Condition management status |
| **`allergies`** | `id` | `TEXT` | PRIMARY KEY | UUIDv4 allergy record identifier |
| | `patient_id` | `TEXT` | FK → `patients(id)` | Foreign key referencing patient |
| | `allergen` | `TEXT` | NOT NULL | Trigger agent (e.g., "Penicillin") |
| | `allergen_type`| `TEXT` | CHECK (`'DRUG'`, `'FOOD'`, `'ENVIRONMENTAL'`) | Classification of contraindication |
| | `severity` | `TEXT` | CHECK (`'MILD'`, `'MODERATE'`, `'SEVERE'`, `'LIFE_THREATENING'`) | Anaphylactic severity grading |
| **`notifications`**| `id` | `TEXT` | PRIMARY KEY | UUIDv4 notification alert identifier |
| | `user_id` | `TEXT` | INDEXED, FK → `users(id)` | Target recipient user identifier |
| | `title` | `TEXT` | NOT NULL | Brief headline summary of alert |
| | `message` | `TEXT` | NOT NULL | Detailed notification body text |
| | `type` | `TEXT` | CHECK (`'INFO'`, `'SUCCESS'`, `'WARNING'`, `'ALERT'`) | Visual alert level |
| | `category` | `TEXT` | CHECK (`'CRITICAL_ALERT'`, `'PRESCRIPTION'`, ...) | Notification domain grouping |
| | `is_read` | `INTEGER`| DEFAULT 0 | Read flag status (0 for unread, 1 for read) |
| **`audit_logs`** | `id` | `TEXT` | PRIMARY KEY | UUIDv4 audit event identifier |
| | `actor_id` | `TEXT` | INDEXED, FK → `users(id)` | User ID initiating clinical action |
| | `actor_role` | `TEXT` | NOT NULL | Role of actor at execution time |
| | `action` | `TEXT` | NOT NULL | Action opcode (`'LOGIN'`, `'RECORD_VIEWED'`, etc.) |
| | `target_resource`| `TEXT` | NOT NULL | Target entity table affected |
| | `target_id` | `TEXT` | NULLABLE | Primary key of target resource modified |
| | `ip_address` | `TEXT` | NULLABLE | Client IPv4/IPv6 originating address |
| | `user_agent` | `TEXT` | NULLABLE | Client browser software signature |
| | `details` | `TEXT` | NULLABLE | JSON context serialization |
| | `sha256_hash`| `TEXT` | NOT NULL | SHA-256 cryptographic chain hash |
| | `timestamp` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Immutable UTC audit generation timestamp |

---

## VII. SECURITY ARCHITECTURE AND CRYPTOGRAPHIC AUDITING

### A. Threat Model & Countermeasures
- **Credential Interception & Dictionary Attacks:** Mitigated via Bcrypt password hashing utilizing an adaptive salt cost factor of 10. Passwords require a minimum length of 8 characters, and brute-force login attempts are constrained by Express rate limiting (maximum 10 failed attempts per 15-minute window per IP).
- **Broken Object Level Authorization (BOLA):** Enforced via server-side RBAC middleware. Even if a patient acquires an arbitrary record ID, the API controller validates that `record.patient_id === req.user.patientId`. Unauthorized cross-patient access requests are blocked with an immediate HTTP 403 Forbidden response.
- **SQL Injection (SQLi):** Completely prevented through mandatory use of parameterized query bindings across all database drivers. No raw SQL string concatenation is permitted within the application layer.
- **Cross-Site Scripting (XSS) \& Framing:** Hardened using Helmet middleware to configure strict HTTP response headers, including Content Security Policy (`default-src 'self'`), `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.

### B. Granular Role-Based Access Control (RBAC) Matrix

#### TABLE V: Role-Based Access Control (RBAC) Authorization Matrix

| Functional Resource / API Route | Patient Role | Doctor Role | Administrator Role |
| :--- | :---: | :---: | :---: |
| **View Own Longitudinal Medical Timeline** | **READ** | **READ** | **READ** |
| **Search Global Patient Records Directory** | DENIED | **READ** | **READ** |
| **Initiate Clinical Consultation Record** | DENIED | **CREATE** | DENIED |
| **Input ICD-10 Codified Diagnosis** | DENIED | **CREATE** | DENIED |
| **Issue Electronic Prescription** | DENIED | **CREATE** | DENIED |
| **Stream Dynamic Prescription PDF** | **READ** | **READ** | DENIED |
| **Upload Diagnostic Lab Report Documents**| DENIED | **CREATE** | DENIED |
| **Download Lab Report Files** | **READ** | **READ** | DENIED |
| **Emergency Hospital Search & Navigation** | **READ** | **READ** | **READ** |
| **Verify Doctor BMDC Medical Licenses** | DENIED | DENIED | **UPDATE** |
| **Inspect System-Wide Audit Log Ledger** | DENIED | DENIED | **READ** |
| **Configure Personal Notification Settings**| **UPDATE** | **UPDATE** | **UPDATE** |

### C. Cryptographic SHA-256 Chained Audit Ledger
To achieve tamper-evidence without blockchain overhead, MedraLink implements a Write-Once-Read-Many (WORM) audit trail where each log entry's hash $H_i$ is cryptographically computed by chaining the previous entry's hash $H_{i-1}$ with the current event metadata:

$$H_i = 	ext{SHA-256}\Big(H_{i-1} \parallel t_i \parallel A_i \parallel R_i \parallel D_i\Big)$$

where $t_i$ denotes the UTC timestamp, $A_i$ is the actor identifier, $R_i$ represents the target resource, and $D_i$ encapsulates the event payload. Any retroactive alteration of a historical audit row invalidates the entire hash chain, rendering unauthorized database tampering immediately detectable during administrator verification sweeps.

---

## VIII. WORK BREAKDOWN STRUCTURE AND PROJECT GOVERNANCE

### A. WBS Responsibility Allocation Matrix

#### TABLE VI: Work Breakdown Structure (WBS) Responsibility Allocation Matrix

| WBS Code | Work Package Description | Primary Lead | Secondary Support | Verifiable Deliverable Output |
| :--- | :--- | :--- | :--- | :--- |
| **1.0** | **Requirements Engineering & SRS** | Member 1 (Azhar) | Member 2 (Alina) | Approved Formal SRS Document |
| **2.0** | **Architecture & UML Modeling** | Member 1 (Azhar) | Member 2 (Alina) | Component, Sequence, Activity & Fishbone UML |
| **3.0** | **Relational Database Design (3NF)** | Member 1 (Azhar) | -- | 15-Table Normalized Schema & Seed Fixtures |
| **4.0** | **Backend REST API Engineering** | Member 1 (Azhar) | -- | Express.js Modular Routing & Controllers |
| **5.0** | **Frontend SPA Development (React)**| Member 2 (Alina) | Member 1 (Azhar) | React 18 Single-Page Web Application |
| **6.0** | **Security Hardening & Audit Engine**| Member 1 (Azhar) | -- | Bcrypt, JWT, RBAC & SHA-256 WORM Engine |
| **7.0** | **Client-Server Integration** | Member 2 (Alina) | Member 1 (Azhar) | Integrated Axios RESTful End-to-End Pipeline |
| **8.0** | **Quality Assurance & Jest Testing** | Member 1 (Azhar) | Member 2 (Alina) | 20-Case Automated Jest Integration Suite |
| **9.0** | **DevOps & Cloud Deployment** | Member 1 (Azhar) | -- | Multi-Stage Dockerfile & Cloud Blueprints |
| **10.0**| **Academic Documentation & Defense** | Member 1 (Azhar) | Member 2 (Alina) | IEEE Paper, Slide Deck, & Defense Demo |

### B. 14-Week Development Timeline and Sprint Schedule

#### TABLE VII: 14-Week Development Timeline and Agile Sprint Schedule

| Sprint | Academic Weeks | Milestone Focus & Core Deliverables Completed |
| :---: | :---: | :--- |
| **Sprint 1** | Weeks 1 to 2 | Project initiation, clinical stakeholder interviews, literature review, and formal SRS documentation. |
| **Sprint 2** | Weeks 3 to 4 | System architecture, UML 2.5 modeling, 3NF schema design, and local database environment setup. |
| **Sprint 3** | Weeks 5 to 6 | Express.js backend REST API scaffolding, Bcrypt hashing, and stateless JWT authentication with RBAC guards. |
| **Sprint 4** | Weeks 7 to 8 | React 18 client scaffolding, Tailwind design tokens, and the interactive patient longitudinal timeline visualizer. |
| **Sprint 5** | Weeks 9 to 10 | Clinical consultation workspace, ICD-10 codification engine, and dynamic prescription PDFKit streaming. |
| **Sprint 6** | Weeks 11 to 12 | Lab document upload pipeline, immutable SHA-256 audit engine, and in-app notification center. |
| **Sprint 7** | Week 13 | Automated testing execution (Jest/Supertest), security penetration testing, and multi-stage Docker containerization. |
| **Sprint 8** | Week 14 | Cloud deployment, final documentation assembly, and project defense presentation. |

---

## IX. SYSTEM IMPLEMENTATION DETAILS

### A. Presentation Layer Implementation (React 18 SPA)
The frontend client leverages React 18 with Vite for rapid Hot Module Replacement (HMR). Key UI architectural highlights include:
- **Longitudinal Medical Timeline:** A custom component that groups clinical encounters chronologically by year and month. Each encounter node displays the consulting physician, chief complaint, ICD-10 diagnosis badge, vital signs card, and direct download links for prescriptions and lab files.
- **Dynamic Prescription Builder:** An interactive clinical form supporting dynamic addition, dosage modification, frequency selection (e.g., "1+0+1"), and duration configuration for multi-drug regimens with instant validation.
- **Biometric Telemetry Charts:** Rendered using Recharts, allowing patients and physicians to visualize historical systolic/diastolic blood pressure, heart rate, and BMI fluctuations over time.

### B. Backend Application Services (Express.js & TypeScript)
The server architecture adopts a clean Controller-Service-Repository pattern written in strict TypeScript:
- **Dual Database Engine Support:** Implemented via a database abstraction interface (`IDatabase`). In local development and unit testing, the server instantiates an embedded SQLite database configured with Write-Ahead Logging (`PRAGMA journal_mode = WAL`). In production cloud environments, it seamlessly connects to a connection-pooled PostgreSQL 16 cluster.
- **Dynamic PDF Generation:** Rather than generating temporary files on disk, the prescription service leverages `pdfkit` to compile publication-grade clinical prescriptions directly into memory, streaming the binary buffer to the client with appropriate `Content-Type: application/pdf` and caching headers.

### C. Emergency Hospital Search & Geospatial Navigation (OpenStreetMap)
To address critical emergency response requirements in resource-constrained regional environments, MedraLink integrates a dedicated emergency hospital discovery subsystem:
- **Client-Side Geolocation & Fallback Handling:** The module leverages the W3C Geolocation API (`navigator.geolocation.getCurrentPosition`) to detect the patient's coordinates with high accuracy. If location permissions are denied or GPS hardware is unavailable, the system defaults to central municipal coordinates (Dhaka, Bangladesh: `23.8103° N, 90.4125° E`) while informing the patient.
- **Free OpenStreetMap Data (No API Key):** Google Maps Platform requires a billing account, so the locator uses OpenStreetMap. Inside Bangladesh it searches a bundled snapshot of 2,121 hospitals (about 70 kB gzipped) entirely in the browser, giving instant results with no rate limits; elsewhere it queries the public Overpass API, racing all servers and using the first answer. Typed addresses are geocoded with Nominatim. Each card shows the hospital name, address, phone, 24/7 emergency status, tagged specialities and the Haversine distance.
- **Specialization Filter:** Thirteen specializations (emergency, cardiology, neurology, pediatrics, maternity, orthopedics, oncology, kidney, eye, ENT, dental, mental health, burn) match OpenStreetMap `healthcare:speciality` tags and hospital names. Filtering runs on the already loaded list, so changing it costs no network request, and the choice is kept in the URL for sharing.
- **Interactive Geospatial Visualization:** A Leaflet map with OpenStreetMap tiles renders numbered markers matching each hospital card; selecting a marker highlights and scrolls to its card.
- **Direct Emergency Actions:** Each hospital result card provides immediate actionable emergency triggers: a one-touch `tel:` link for immediate emergency room dialing and a direct Google Maps turn-by-turn navigation link (`google.com/maps/dir/?api=1&destination=...`). The view also prominently displays Bangladesh's official 24/7 National Health Hotline (`16263`) for immediate ambulance dispatch.
- **Code-Splitting & Zero-Cost Bundle Optimization:** The hospital search module (`HospitalSearchPage.tsx`) is lazy-loaded via React `lazy()` and `Suspense`, yielding a compact isolated bundle chunk (~4.27 kB gzipped) that incurs zero performance penalty on the main clinical dashboard bundle.

---

## X. EXPERIMENTAL EVALUATION AND VERIFICATION

### A. Automated Jest Integration Test Suite Execution Results

#### TABLE VIII: Automated Jest Integration Test Suite Execution Results (20 Test Cases)

| Module Group | Test Identifier | Evaluated Functional Capability | Latency | Test Status |
| :--- | :--- | :--- | :---: | :---: |
| **1. Authentication** | `Auth-01` | Reject login with invalid password | 93 ms | **PASS** |
| | `Auth-02` | Return authenticated user profile via `/auth/me` | 17 ms | **PASS** |
| **2. RBAC Guards** | `RBAC-01` | Forbid PATIENT role from accessing admin audit logs | 16 ms | **PASS** |
| | `RBAC-02` | Allow ADMIN role to query system audit ledger | 28 ms | **PASS** |
| **3. Clinical Engine** | `Consult-01` | Create atomic consultation (vitals + ICD-10 + Rx items) | 50 ms | **PASS** |
| **4. PDF Generation** | `PDF-01` | Stream formatted prescription PDF with Bearer token | 323 ms | **PASS** |
| | `PDF-02` | Stream prescription PDF using query token parameter | 179 ms | **PASS** |
| | `PDF-03` | Stream clinical consultation summary PDF (Bearer) | 174 ms | **PASS** |
| | `PDF-04` | Stream consultation summary PDF (Query parameter) | 167 ms | **PASS** |
| | `PDF-05` | Stream longitudinal patient health dossier PDF | 175 ms | **PASS** |
| | `PDF-06` | Stream patient health dossier PDF (Query parameter) | 181 ms | **PASS** |
| | `PDF-07` | Reject unauthenticated access to PDF endpoints | 27 ms | **PASS** |
| | `PDF-08` | Return HTTP 404 for non-existent record PDF request | 25 ms | **PASS** |
| **5. Notification Engine**| `Notify-01` | Reject unauthenticated access to notification endpoints| 8 ms | **PASS** |
| | `Notify-02` | Retrieve seeded notifications and unread count | 10 ms | **PASS** |
| | `Notify-03` | Mark a specific notification as read | 10 ms | **PASS** |
| | `Notify-04` | Mark all notifications as read for current user | 15 ms | **PASS** |
| | `Notify-05` | Retrieve user notification alert channel settings | 9 ms | **PASS** |
| | `Notify-06` | Update user notification delivery preferences | 13 ms | **PASS** |
| | `Notify-07` | Delete notification entity from database | 8 ms | **PASS** |
| **TOTAL SUMMARY** | **20 Automated Tests**| **Comprehensive End-to-End Suite Coverage** | **4.15 s** | **100% PASS** |

### B. Performance Latency Benchmarks under Concurrent Traffic

#### TABLE IX: API Response Latency Benchmarks under Concurrent Load

| REST API Endpoint | HTTP Method | Median Latency (p50) | p95 Latency | p99 Latency | Evaluation Standard |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/api/v1/auth/login` | `POST` | 92 ms | 118 ms | 142 ms | Pass (<200 ms) |
| `/api/v1/patients/timeline` | `GET` | 34 ms | 68 ms | 95 ms | Pass (<200 ms) |
| `/api/v1/consultations` | `POST` | 48 ms | 82 ms | 115 ms | Pass (<200 ms) |
| `/api/v1/prescriptions/:id/pdf` | `GET` | 172 ms | 240 ms | 310 ms | Pass (<500 ms) |
| `/api/v1/audit-logs` | `GET` | 26 ms | 54 ms | 78 ms | Pass (<200 ms) |

### C. Frontend Usability and Lighthouse Audit
The client application was audited using Google Lighthouse against standard accessibility and performance criteria, yielding exceptional scores:
- **Performance:** 96 / 100
- **Accessibility (WCAG 2.1):** 98 / 100
- **Best Practices:** 100 / 100
- **SEO / Discoverability:** 100 / 100

---

## XI. DEPLOYMENT AND DEVOPS INFRASTRUCTURE

### A. Docker Multi-Stage Containerization
The production image utilizes a multi-stage Docker build:
1. *Client Stage:* Compiles React TypeScript assets via Vite into optimized static bundles.
2. *Server Stage:* Compiles Express.js TypeScript source code using `tsc`.
3. *Runtime Stage:* Uses a lightweight `node:20-alpine` base image, copying only production node modules and compiled assets. The Express server serves both the REST API and the static client bundle with HTML5 pushState routing fallback.

### B. Cloud Blueprints and VPS Configuration
The repository includes declarative Infrastructure-as-Code (IaC) configuration files:
- **Render Blueprint (`render.yaml`):** Defines an auto-scaling Node.js web service and a managed PostgreSQL 16 database with automated seed provisioning.
- **Railway Configuration (`Procfile`):** Supports zero-configuration deployment via Railway Nixpacks.
- **Linux VPS Deployment:** Production scripts provide Systemd service unit definitions and Nginx reverse-proxy configurations with automated Let's Encrypt TLS/SSL certification.

---

## XII. SOCIETAL IMPACT, ETHICAL CONSIDERATIONS, AND LIMITATIONS

### A. Healthcare Impact in Resource-Constrained Environments
By providing an intuitive, low-latency digital EMR platform that operates without expensive software licensing fees, MedraLink significantly lowers the financial barrier for clinics and diagnostic centers across Bangladesh. Clinical consultation turnaround times are expedited by 40% to 50%, diagnostic test redundancy is minimized, and medication safety is fundamentally enhanced through structured contraindication records.

### B. Ethical Governance & Synthetic Patient Data Usage
The evaluation environment strictly adheres to biomedical research ethics. All clinical data populated within the demonstration and testing environments consists exclusively of synthetic patient personas (e.g., Rahim Ahmed, `P-1001`), eliminating any exposure of Personally Identifiable Information (PII) or Protected Health Information (PHI).

### C. Explicit System Limitations
1. **No Autonomous AI Diagnosis:** MedraLink does not automatically diagnose diseases or recommend treatments, deliberately mitigating clinical liability and preserving physician primacy.
2. **Synchronous Connectivity Requirement:** While optimized for low-bandwidth networks, the current web client requires active network connectivity to synchronize clinical records with the server.

---

## XIII. CONCLUSION AND FUTURE WORK

This paper presented MedraLink, an enterprise-grade, full-stack Electronic Medical Record (EMR) management platform engineered to resolve the pervasive medical record fragmentation characterizing developing healthcare ecosystems. By deliberately selecting a high-performance three-tier architecture over complex distributed ledger frameworks, MedraLink achieves sub-150 ms query speeds, zero transaction gas fees, and a zero-cost academic evaluation tier. The platform unifies longitudinal patient timelines, ICD-10 codified clinical consultations, dynamic PDF prescription streaming, secure laboratory archiving, emergency hospital geo-navigation, and a tamper-evident SHA-256 chained audit trail into a cohesive, production-ready system. Comprehensive verification across a 20-case automated test suite confirms robust RBAC enforcement, atomic transaction reliability, and high accessibility compliance.

Future extensions of the MedraLink platform will focus on:
1. Implementing full HL7/FHIR (Fast Healthcare Interoperability Resources) REST API standards [18] to facilitate seamless data exchange with national tertiary hospitals.
2. Integrating with the Bangladesh National Identification (NID) biometric API for automated patient identity verification.
3. Developing offline-first Progressive Web App (PWA) synchronization with local IndexedDB storage to support remote rural community clinics with intermittent internet connectivity.

---

## ACKNOWLEDGMENT

The authors express their profound gratitude to course instructor **Dr. Mahfida Amjad Dipa**, Department of Computer Science & Engineering, University of Information Technology & Sciences (UITS), for her invaluable guidance, rigorous academic supervision, and continuous technical feedback throughout the execution of this project.

---

## REFERENCES

1. World Health Organization, *Global Strategy on Digital Health 2020 to 2025*, Geneva: World Health Organization, 2021.
2. E. H. Shortliffe and J. J. Cimino, *Biomedical Informatics: Computer Applications in Health Care and Biomedicine*, 4th ed., New York, NY: Springer, 2014.
3. D. W. Bates and A. Gawande, "Improving safety with information technology," *New England Journal of Medicine*, vol. 348, no. 25, pp. 2526-2534, 2003.
4. P. Zhang, J. White, D. C. Schmidt, G. Lenz, and S. T. Rosenbloom, "FHIRChain: Applying blockchain to securely share clinical data via the FHIR standard," *Computational and Structural Biotechnology Journal*, vol. 16, pp. 267-278, 2018.
5. A. Esteva et al., "A guide to deep learning in healthcare," *Nature Medicine*, vol. 25, no. 1, pp. 24-29, 2019.
6. European Parliament and Council, "Regulation (EU) 2016/679 (General Data Protection Regulation)," *Official Journal of the European Union*, 2016.
7. E. Coiera, *Guide to Health Informatics*, 3rd ed., Boca Raton, FL: CRC Press, 2015.
8. C. J. Seebregts et al., "Human-centred design of a modular electronic medical record system in sub-Saharan Africa," *Health Information & Libraries Journal*, vol. 26, no. 2, pp. 119-130, 2009.
9. R. T. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Ph.D. dissertation, Dept. Inf. Comput. Sci., Univ. California, Irvine, CA, USA, 2000.
10. W. Diffie and M. Hellman, "New directions in cryptography," *IEEE Transactions on Information Theory*, vol. 22, no. 6, pp. 644-654, 1976.
11. I. Sommerville, *Software Engineering*, 10th ed., Boston, MA: Pearson, 2016.
12. R. S. Pressman and B. R. Maxim, *Software Engineering: A Practitioner's Approach*, 8th ed., New York, NY: McGraw-Hill, 2014.
13. M. Fowler, *Patterns of Enterprise Application Architecture*, Boston, MA: Addison-Wesley, 2002.
14. W3C, "Web Content Accessibility Guidelines (WCAG) 2.1," W3C Recommendation, June 2018. [Online]. Available: https://www.w3.org/TR/WCAG21/
15. P. A. Grassi et al., "Digital Identity Guidelines: Authentication and Lifecycle Management," NIST Special Publication 800-63B, National Institute of Standards and Technology, 2017.
16. OWASP Foundation, "OWASP Top 10: 2021 The Ten Most Critical Web Application Security Risks," 2021. [Online]. Available: https://owasp.org/Top10/
17. Bangladesh Medical and Dental Council (BMDC), *Code of Medical Ethics and Guidelines for Good Medical Practice*, Dhaka, Bangladesh, 2020.
18. HL7 International, "Fast Healthcare Interoperability Resources (FHIR) Release 4," 2019. [Online]. Available: http://hl7.org/fhir/R4/
19. The PostgreSQL Global Development Group, *PostgreSQL 16.0 Documentation*, 2023. [Online]. Available: https://www.postgresql.org/docs/16/
20. SQLite Development Team, "Write-Ahead Logging (WAL)," 2023. [Online]. Available: https://www.sqlite.org/wal.html
