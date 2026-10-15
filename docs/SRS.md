# System Requirements Specification (SRS) | Web Version

**Notice:** This documentation applies exclusively to the **Web Version** of the MedraLink prototype.

## Functional Requirements

* User registration/login
* Patient registration
* Medical record creation
* Prescription management
* Lab report management
* Appointment management
* Role-based access (Admin, Doctor, Patient)
* Medical history viewing
* Interactive Patient Medical Timeline
* PDF prescription generation
* Emergency hospital locator and nearby medical facility search (Google Maps Platform)
* Real-time GPS geolocation detection and distance computation
* Turn-by-turn emergency navigation and one-touch facility dialing
* National health emergency hotline integration (24/7 Toll-free 16263)
* Audit logging of all modifications

## Non-functional Requirements

* Security (JWT, RBAC, password hashing, SQL injection protection, XSS protection)
* Availability
* Usability (Bengali + English interface support)
* Maintainability
* Scalability (Stateless Node.js backend)
* Performance (PostgreSQL performance indexing)
