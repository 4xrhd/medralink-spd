# 🏥 MedraLink — Enterprise Electronic Medical Record (EMR) Platform

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue?style=flat-square&logo=githubactions)](https://github.com/4xrhd/medralink-spd/actions)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20%7C%20SQLite-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/deployment-production--ready-success?style=flat-square)](#-production-deployment-guides)

---

## 📌 System Overview

**MedraLink** is an enterprise-grade Electronic Medical Record (EMR) and clinical consultation management platform built to unify fragmented healthcare workflows. It integrates patient demographics, BMDC-verified physician credentialing, clinical consultation notes, ICD-10 diagnostic coding, real-time vital telemetry, dynamic PDF electronic prescriptions, and diagnostic lab report management into a cohesive, longitudinal medical record timeline.

### Key Architectural Highlights
- **High-Performance 3-Tier Architecture:** React 18 TypeScript SPA (Vite + Tailwind CSS) with Express.js REST API and 3NF-normalized PostgreSQL/SQLite persistence.
- **Single-Service Cloud Deployable:** The Express server automatically compiles and statically serves the SPA client in production with HTML5 history pushState fallback, enabling single-container deployments on Render, Railway, Fly.io, or VPS instances.
- **Regulatory-Grade Security:** Granular Role-Based Access Control (RBAC), Helmet CSP hardening, Gzip/Brotli compression, Morgan request logging, rate limiting (auth + general API), parameterized SQL execution, and an immutable SHA-256 cryptographic audit trail.
- **Dual Database Engine Support:** Instant zero-config embedded SQLite for rapid development and testing; enterprise connection-pooled PostgreSQL with auto-SSL detection for production cloud deployments.

---

## 🔑 Pre-Configured Demo Credentials (1-Click Switcher)

The application includes pre-seeded accounts and a sticky **1-Click Role Switcher** at the top of the interface:

| Role | Name & Identifier | Demo Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Doctor** | Dr. Ahmed Tariq (`DOC-2001`) | `dr.ahmed@medralink.com` | `doctor123` | Patient lookup, clinical consultation workspace, ICD-10 codification, digital prescription generator, PDF export. |
| **Patient** | Rahim Ahmed (`P-1001`) | `rahim@gmail.com` | `patient123` | Interactive Longitudinal Medical Timeline, prescription history, vital sign telemetry, lab report viewer. |
| **Administrator** | System Administrator (`ADMIN`) | `admin@medralink.com` | `admin123` | Doctor BMDC license verification, patient registry overview, tamper-evident audit ledger inspection. |

---

## 🚀 Production Deployment Guides

MedraLink is fully pre-configured for multiple cloud and on-premise deployment environments:

### 1. 🐳 Docker & Docker Compose (Recommended)

Run the entire full-stack application and isolated PostgreSQL 16 database with persistent storage:

```bash
# Clone the repository
git clone https://github.com/4xrhd/medralink-spd.git
cd medralink-spd/prototype

# Copy production environment template
cp .env.example .env

# Build and launch multi-stage production containers
docker compose up -d --build

# View container logs
docker compose logs -f app
```
The application will be live at `http://localhost:5000` with automated health checks on `http://localhost:5000/api/health`.

---

### 2. ☁️ Render Blueprint Deployment

MedraLink includes an official Infrastructure-as-Code blueprint in [`render.yaml`](./render.yaml):

1. Fork or push this repository to your GitHub account.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **Blueprints** ➔ **New Blueprint Instance**.
4. Connect your `medralink-spd` repository.
5. Render will automatically provision:
   - Managed **PostgreSQL 16 Database** (`medralink-db`)
   - Auto-scaling **Node.js Web Service** (`medralink-app`) running `npm start`
   - Automated database migrations and seed provisioning (`AUTO_SEED=true`)
   - HTTPS endpoint with SSL certification and health probes.

---

### 3. 🚂 Railway Deployment

Deploy with zero configuration using Railway's Nixpacks builder and [`Procfile`](./Procfile):

1. Create a new project in [Railway](https://railway.app).
2. Deploy from GitHub Repo: select `4xrhd/medralink-spd`.
3. Add a **PostgreSQL** database service from the Railway dashboard.
4. Set the following environment variables in your web service:
   ```env
   NODE_ENV=production
   DB_DIALECT=postgres
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   AUTO_SEED=true
   JWT_SECRET=generate_secure_random_hex_key
   ```
5. Railway will automatically execute `npm run build` and launch via `web: npm start`.

---

### 4. 🪰 Fly.io Deployment

Deploy to Fly.io edge servers using the included [`fly.toml`](./fly.toml):

```bash
# Install flyctl if not present
curl -L https://fly.io/install.sh | sh

# Launch application
fly launch --config fly.toml --copy-config --no-deploy

# Set secret environment variables
fly secrets set JWT_SECRET=$(openssl rand -hex 32)

# Deploy to Fly.io
fly deploy
```

---

### 5. 🐧 Linux VPS (Ubuntu / Debian) with Nginx & Systemd

For bare-metal or cloud virtual servers (AWS EC2, DigitalOcean, Hetzner, Linode):

#### Step A: System Prerequisites
```bash
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

#### Step B: Install Application
```bash
sudo useradd -m -s /bin/bash medralink
sudo git clone https://github.com/4xrhd/medralink-spd.git /opt/medralink
sudo chown -R medralink:medralink /opt/medralink

cd /opt/medralink/prototype
sudo -u medralink npm run install:all
sudo -u medralink npm run build
```

#### Step C: Configure Systemd Service
```bash
sudo mkdir -p /etc/medralink
sudo cp /opt/medralink/prototype/.env.example /etc/medralink/medralink.env
# Edit credentials: sudo nano /etc/medralink/medralink.env

sudo cp /opt/medralink/prototype/deployment/medralink.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now medralink.service
sudo systemctl status medralink.service
```

#### Step D: Configure Nginx Reverse Proxy & SSL
```bash
sudo cp /opt/medralink/prototype/deployment/nginx.conf /etc/nginx/sites-available/medralink.conf
sudo ln -s /etc/nginx/sites-available/medralink.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtain free Let's Encrypt SSL certificate
sudo certbot --nginx -d emr.yourdomain.com
```

---

## 💻 Local Development Quickstart

### Option 1: Unified NPM Scripts (Root)
```bash
cd prototype

# Install all server & client dependencies
npm run install:all

# Seed database with initial clinical records
npm run seed

# Run both backend server and client concurrently
npm run dev
```

### Option 2: Individual Services
```bash
# Terminal 1: Backend API (Port 5000)
cd prototype/server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd prototype/client
npm run dev
```

---

## 🧪 Automated Testing & Verification Suite

MedraLink maintains an automated test suite verifying credential validation, role security guards, atomic transactions, and PDF streaming:

```bash
cd prototype/server
npm test
```

### Test Coverage Highlights:
- `POST /api/v1/auth/login`: Validates Bcrypt hash comparison and signed JWT token issuance.
- `GET /api/v1/auth/me`: Verifies claims decryption and active session resolution.
- `RBAC Authorization Guards`: Verifies `403 Forbidden` response when Patient roles attempt admin log access.
- `POST /api/v1/consultations`: Verifies atomic relational transaction spanning vitals, diagnoses, prescriptions, prescription items, and audit logs.
- `GET /api/v1/prescriptions/:id/pdf`: Validates binary PDF streaming with official medical formatting.

---

## 📡 REST API Specifications

All endpoints are versioned under `/api/v1`:

### Health & Monitoring
- `GET /api/health` — System status, DB connection latency, memory usage (RSS/heap), uptime.
- `GET /health` — Load balancer liveness check endpoint.

### Authentication & Authorization
- `POST /api/v1/auth/login` — Authenticate user and issue JWT token.
- `POST /api/v1/auth/register` — Patient self-registration.
- `GET /api/v1/auth/me` — Retrieve active user session and profile.

### Clinical Workflows
- `GET /api/v1/patients/search?q=:query` — Doctor search for patient by name, phone, or ID.
- `GET /api/v1/patients/:id/timeline` — Retrieve unified longitudinal medical timeline.
- `POST /api/v1/consultations` — Submit complete atomic consultation visit (vitals + diagnosis + prescription).
- `GET /api/v1/prescriptions/:id` — Fetch prescription details and items.
- `GET /api/v1/prescriptions/:id/pdf` — Stream official PDF prescription document.
- `POST /api/v1/lab-reports` — Upload diagnostic lab report attachment.

### Administration & Governance
- `GET /api/v1/admin/doctors` — List all registered physicians and verification statuses.
- `PATCH /api/v1/admin/doctors/:id/verify` — Verify physician BMDC license.
- `GET /api/v1/admin/audit-logs` — Query immutable SHA-256 cryptographically chained audit trail.

---

## 🛡️ Enterprise Security & Data Integrity

- **Cryptographic Password Security:** Bcrypt hashing with adaptive salt generation ($\ge 10$ rounds).
- **Zero Raw SQL String Concatenation:** Strict parameter binding across all SQLite and PostgreSQL queries to eliminate SQL injection vulnerabilities.
- **Append-Only Audit Ledger:** Every clinical modification registers Actor ID, Role, IP Address, Timestamp, Action, and SHA-256 integrity checksum.
- **Strict Content Security Policy (CSP):** Helmet HTTP security headers configured with resource isolation.
- **DDoS & Brute-Force Rate Limiting:** Stricter rate limits on `/api/v1/auth` (50 req/15min) and general API protection (600 req/15min).

---

## 📄 License
This software is licensed under the [MIT License](LICENSE).
