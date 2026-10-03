import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Card, Icon, Button, VitalPill } from '../ui/primitives.js';
import { EcgLine, SectionHeading, StepCard } from '../ui/medical.js';

export const LandingPage: React.FC = () => {
  useDocumentTitle('MedraLink | Connected Health Records for Patients and Doctors');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: "Physician Workstation", icon: <Icon.Stethoscope size={16} /> },
    { label: "Patient Health Portal", icon: <Icon.User size={16} /> },
    { label: "Clinical Administration", icon: <Icon.Shield size={16} /> },
  ];

  const content = [
    {
      title: "Rapid clinical documentation, structured for patient continuity",
      subtitle: "Engineered for high-volume outpatient clinics and hospital chambers with zero repetitive paperwork.",
      features: [
        ["Searchable ICD-10 Codification", "Quick-select diagnosis chips backed by comprehensive ICD-10 clinical database."],
        ["Structured E-Prescriptions", "Dosage, frequency, meal timing, and duration validation with built-in safety checks."],
        ["Live Vitals Telemetry Matrix", "Automated BMI computation with threshold-aware blood pressure, pulse, and SpO2 alerts."],
        ["Cryptographic Digital Signature", "Finalize, cryptographically sign, and issue an official prescription sheet in one step."],
      ],
    },
    {
      title: "A longitudinal health timeline patients can actually understand",
      subtitle: "Every consultation, prescription, and attached diagnostic test organized into one clear story.",
      features: [
        ["Continuous Vertical Timeline", "Consultations rendered on an intuitive chronological tree spanning every visit."],
        ["Diagnostic Lab Streaming", "High-resolution laboratory reports attached and reviewable directly against each visit."],
        ["Allergy & Safety Alerts", "Prominent warning strips surface known allergies and chronic conditions instantly."],
        ["Official PDF & QR Verification", "Download legally valid prescription sheets equipped with instant QR verification."],
      ],
    },
    {
      title: "Clinical governance held to national and hospital standards",
      subtitle: "Role-scoped access control ensuring confidential medical data is protected at every touchpoint.",
      features: [
        ["BMDC Credential Verification", "Verify and validate physician credentials with real-time license lookups."],
        ["Immutable Cryptographic Audit Trail", "Every consultation record and update written to an append-only SHA-256 ledger."],
        ["Strict Role-Based Access Control", "Rigid privilege boundaries enforced across doctors, patients, and clinic administrators."],
        ["Real-Time Platform Telemetry", "Live uptime, active record volumes, and compliance KPIs monitored continuously."],
      ],
    },
  ];

  const handleLaunchDoctor = () => {
    if (user?.role === 'DOCTOR') {
      navigate('/doctor');
    } else {
      navigate('/login?role=doctor');
    }
  };

  const handleLaunchPatient = () => {
    if (user?.role === 'PATIENT') {
      navigate('/patient');
    } else {
      navigate('/login?role=patient');
    }
  };

  const handleLaunchAdmin = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/login?role=admin');
    }
  };

  return (
    <div className="bg-canvas min-h-screen">
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 via-white to-canvas border-b border-hair">
        {/* Animated ECG Heartbeat Background Line */}
        <div className="absolute top-12 left-0 right-0 opacity-20 pointer-events-none">
          <EcgLine strokeClassName="stroke-primary-600" />
        </div>

        <div className="mx-auto grid max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 items-center gap-12 2xl:gap-16 px-4 sm:px-6 lg:px-8 2xl:px-12 py-14 sm:py-18 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="relative z-10">
            {/* Plain text eyebrow: NO BADGE */}
            <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-primary-700 flex items-center gap-2">
              <Icon.HeartPulse size={16} className="text-primary-600 shrink-0" />
              <span>Connected Care for Clinicians &amp; Patients</span>
            </p>

            <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-[54px]">
              Your complete health record, in one caring place.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
              Eliminate lost paper slips and repeated diagnostic testing. MedraLink connects patients,
              verified physicians, and diagnostic clinics with one lifelong, role-secured medical timeline.
            </p>

            {/* Primary Action Group */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant="primary"
                onClick={handleLaunchDoctor}
                icon={<Icon.Arrow size={16} />}
                iconPosition="right"
              >
                Launch Doctor Workstation
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleLaunchPatient}
                icon={<Icon.User size={16} />}
              >
                Explore Patient Timeline
              </Button>
            </div>

            {/* Medical Trust Indicators (Plain text + medical icons, no badges) */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-hair pt-6 text-xs text-ink-600">
              <div className="flex items-center gap-2 font-medium">
                <Icon.ShieldPlus size={16} className="text-primary-600 shrink-0" />
                <span>BMDC Verified</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Icon.Lock size={16} className="text-primary-600 shrink-0" />
                <span>Encrypted Records</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Icon.Capsule size={16} className="text-primary-600 shrink-0" />
                <span>Digital E-Rx</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Icon.HeartPulse size={16} className="text-primary-600 shrink-0" />
                <span>Lifelong History</span>
              </div>
            </div>
          </div>

          {/* Floating Live Consultation Workstation Preview */}
          <div className="relative z-10">
            <div className="absolute -inset-4 sm:-inset-6 rounded-3xl bg-gradient-to-br from-primary-100/50 via-care-500/10 to-transparent blur-xl" />
            <Card className="relative p-5 sm:p-6 shadow-card hover:shadow-card-hover border-hair bg-surface">
              <div className="flex items-center justify-between border-b border-hair pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
                    <Icon.Stethoscope size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900">Dr. Ahmed Tariq, MBBS</p>
                    <p className="text-xs text-ink-400">Consultation Session • Patient: Rahim Ahmed (P-1001)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live Session
                </span>
              </div>

              {/* Vitals Telemetry Row */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <VitalPill label="Blood Pressure" value="120/80" tone="slate" />
                <VitalPill label="Heart Pulse" value="74 bpm" tone="slate" />
                <VitalPill label="Oxygen (SpO₂)" value="99%" tone="emerald" />
              </div>

              {/* Diagnosis Row */}
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                  Clinical Diagnosis (ICD-10)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    [I10] Essential Hypertension
                  </span>
                  <span className="inline-flex items-center rounded-lg border border-hair bg-canvas px-2.5 py-1 text-xs font-medium text-ink-600">
                    [E11] Type 2 Diabetes
                  </span>
                </div>
              </div>

              {/* Digital Prescription Preview Card */}
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Icon.Capsule size={15} /> Official Digital Prescription
                  </div>
                  <span className="font-mono text-[10px] text-emerald-600">QR Verified</span>
                </div>
                <div className="space-y-1.5 text-xs text-ink-900 font-medium">
                  <div className="flex justify-between tabular">
                    <span>Tab. Amlocard 5mg (Amlodipine)</span>
                    <span className="font-mono text-ink-600">1 + 0 + 0 • 30 Days</span>
                  </div>
                  <div className="flex justify-between tabular">
                    <span>Tab. Napa Extra (Paracetamol/Caffeine)</span>
                    <span className="font-mono text-ink-600">1 + 0 + 1 • As needed</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Care Impact Pillars */}
      <section id="network-clinics" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-10 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              metric: "One Unified Record",
              desc: "Eliminates duplicate diagnostic scans and lost paper prescriptions across clinics.",
              icon: <Icon.ClipboardHeart size={20} className="text-primary-600" />,
            },
            {
              metric: "Allergy Safe Checks",
              desc: "Surfaces drug allergies and historical contraindications before finalizing any prescription.",
              icon: <Icon.ShieldPlus size={20} className="text-primary-600" />,
            },
            {
              metric: "Real-Time Telemetry",
              desc: "Instant ICD-10 codification, vitals matrix computation, and longitudinal visit history.",
              icon: <Icon.HeartPulse size={20} className="text-primary-600" />,
            },
            {
              metric: "Cryptographic Audit",
              desc: "Every consultation and modification is recorded in an immutable append-only ledger.",
              icon: <Icon.Lock size={20} className="text-primary-600" />,
            },
          ].map((item) => (
            <Card key={item.metric} className="p-6 border-hair hover:border-primary-200">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 mb-4">
                {item.icon}
              </div>
              <p className="font-display text-lg font-bold text-ink-900">{item.metric}</p>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Problem vs MedraLink Solution */}
      <section id="solutions" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-16">
        <SectionHeading
          eyebrow="The Healthcare Challenge"
          title="From fragmented records to one continuous timeline"
          subtitle="How MedraLink transforms disconnected clinic visits into a safe, lifelong care journey."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              image: "/assets/data_fragmentation.png",
              imageAlt: "Fragmented physical medical records and prescriptions",
              accent: "#E11D48",
              headerBg: "bg-rose-50/70 border-b border-rose-100",
              title: "Fragmented Paper Slips",
              body: "Clinical data is lost between visits, forcing repetitive diagnostic testing and inflating patient costs. No physician sees the full picture.",
              tag: "Data Fragmentation",
            },
            {
              image: "/assets/drug_interaction.png",
              imageAlt: "Pharmaceutical bottles with alert badge illustrating contraindications",
              accent: "#D97706",
              headerBg: "bg-amber-50/70 border-b border-amber-100",
              title: "Medication Safety Hazards",
              body: "Unreviewed allergies and drug interactions lead to severe adverse reactions when prescribing physicians lack historical context.",
              tag: "Clinical Risk",
            },
            {
              image: "/assets/unified_timeline.png",
              imageAlt: "Connected digital medical timeline ribbon with diagnostic nodes",
              accent: "#0D9488",
              headerBg: "bg-primary-50/80 border-b border-primary-100",
              title: "MedraLink Unified Timeline",
              body: "A single, continuous medical history accessible under strict role-based access control: every consultation, prescription, and lab in one record.",
              tag: "Verified Solution",
            },
          ].map((c) => (
            <Card
              key={c.title}
              className="group flex flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover border-hair"
              style={{ borderTopWidth: 3, borderTopColor: c.accent }}
            >
              <div className={`flex h-44 w-full items-center justify-center p-4 ${c.headerBg}`}>
                <img
                  src={c.image}
                  alt={c.imageAlt}
                  className="max-h-32 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: c.accent }}>
                  {c.tag}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold text-ink-900">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{c.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works - The Care Journey */}
      <section id="how-it-works" className="scroll-mt-24 bg-primary-50/40 border-y border-hair py-14 sm:py-20">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12">
          <SectionHeading
            align="center"
            eyebrow="How MedraLink Works"
            title="A seamless journey from registration to recovery"
            subtitle="Designed for clinical simplicity, safety, and instant physician adoption."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <StepCard
              step={1}
              icon={<Icon.IdCard size={20} className="text-primary-700" />}
              title="Universal Patient Health ID"
              description="Patients receive a single unique Health UID linking all future consultations, lab reports, and allergy profiles into one permanent record."
            />
            <StepCard
              step={2}
              icon={<Icon.Stethoscope size={20} className="text-primary-700" />}
              title="Physician Consultation"
              description="Doctors review prior medical history in seconds, capture live vital telemetry, assign ICD-10 diagnoses, and issue cryptographically signed prescriptions."
            />
            <StepCard
              step={3}
              icon={<Icon.ClipboardHeart size={20} className="text-primary-700" />}
              title="Continuous Care &amp; Access"
              description="Patients view their longitudinal timeline anytime on mobile or desktop, while pharmacies and diagnostic clinics verify orders with secure QR scanning."
            />
          </div>
        </div>
      </section>

      {/* Role-Based Clinical Workspaces */}
      <section id="clinical-architecture" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-14 sm:py-20">
        <SectionHeading
          align="center"
          eyebrow="Tailored Clinical Interfaces"
          title="Role-based workspaces designed for every healthcare stakeholder"
          subtitle="Specialized interfaces engineered specifically for attending physicians, patients, and clinical governance teams."
        />

        {/* Centered Segmented Control Tab Bar */}
        <div className="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Clinical workspace features"
            className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-hair bg-primary-50/70 p-1.5"
          >
            {tabs.map((t, i) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={tab === i}
                aria-controls={`workspace-panel-${i}`}
                onClick={() => setTab(i)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  tab === i
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-ink-600 hover:text-ink-900 hover:bg-white/80"
                }`}
              >
                <span className={tab === i ? "text-primary-100" : "text-primary-600"}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Card id={`workspace-panel-${tab}`} role="tabpanel" className="mt-8 p-6 sm:p-8 border-hair">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hair pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                {tabs[tab].label}
              </p>
              <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-ink-900">
                {content[tab].title}
              </h3>
              <p className="mt-1 text-sm text-ink-600">
                {content[tab].subtitle}
              </p>
            </div>
            {tab === 0 && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleLaunchDoctor}
                icon={<Icon.Arrow size={14} />}
                iconPosition="right"
              >
                Open Workstation
              </Button>
            )}
            {tab === 1 && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleLaunchPatient}
                icon={<Icon.Arrow size={14} />}
                iconPosition="right"
              >
                View Health Record
              </Button>
            )}
            {tab === 2 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleLaunchAdmin}
                icon={<Icon.Arrow size={14} />}
                iconPosition="right"
              >
                Access Governance
              </Button>
            )}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {content[tab].features.map(([t, b]) => (
              <div
                key={t}
                className="flex gap-3.5 rounded-xl border border-hair bg-canvas p-4 transition-all hover:bg-white hover:border-primary-200 hover:shadow-subtle"
              >
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon.Check size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-900">{t}</p>
                  <p className="mt-1 text-xs sm:text-sm text-ink-600 leading-relaxed">{b}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Enterprise Security & Compliance Banner */}
      <section id="governance" className="scroll-mt-24 bg-gradient-to-br from-primary-900 via-primary-800 to-ink-900 py-16 text-white">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12">
          <p className="text-xs font-bold tracking-wider uppercase text-primary-200">
            Enterprise Security &amp; Compliance
          </p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Bank-grade privacy protection for every patient record
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Role-Based Access Control", "Strict RBAC scoping every clinical record to authorized medical staff.", <Icon.Lock size={20} />],
              ["TLS 1.3 & AES-256", "Encryption in transit and at rest across the entire platform database.", <Icon.Shield size={20} />],
              ["SQL Injection Defense", "Parameterized queries and prepared statements applied across all endpoints.", <Icon.File size={20} />],
              ["Immutable Audit Ledger", "Append-only cryptographic ledger tracking every record creation and view.", <Icon.Pulse size={20} />],
            ].map(([t, b, icon]) => (
              <div key={t as string} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xs">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-primary-200">
                  {icon}
                </div>
                <p className="mt-4 font-display text-lg font-semibold">{t as string}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{b as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Card */}
      <section className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12 py-14 sm:py-18">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-700 via-primary-600 to-care-500 p-8 sm:p-12 text-white shadow-elevated">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Start your connected health journey with MedraLink
            </h2>
            <p className="mt-3 text-base sm:text-lg text-primary-50 leading-relaxed">
              Empower your clinical practice with structured E-prescribing and give patients a lifelong health timeline they can trust.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleLaunchDoctor}
                icon={<Icon.Arrow size={16} />}
                iconPosition="right"
              >
                Launch Doctor Workstation
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white/40 hover:bg-white/10"
                onClick={handleLaunchPatient}
              >
                Explore Patient Timeline
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Footer */}
      <footer id="support" className="scroll-mt-24 border-t border-hair bg-surface text-ink-600">
        {/* Medical Emergency Strip */}
        <div className="border-b border-hair bg-rose-50/80 px-4 py-3 text-center text-xs text-rose-800 font-medium">
          <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2">
            <Icon.Alert size={14} className="text-critical shrink-0" />
            <span>Need urgent emergency medical assistance? Please dial 999 or proceed immediately to the nearest hospital emergency room.</span>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-14">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
                  <Icon.Cross size={18} />
                </div>
                <span className="font-display text-lg font-extrabold tracking-tight text-ink-900">
                  Medra<span className="text-primary-600">Link</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600">
                Connected Electronic Medical Record &amp; clinical continuity infrastructure for patients,
                physicians, and healthcare networks.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary-700">
                <Icon.Hospital size={15} />
                <span>CSE 416 • Software Project Design &amp; Development</span>
              </div>
            </div>

            {[
              ["Platform Solutions", [
                ["Physician Workstation", "/doctor"],
                ["Patient Health Timeline", "/patient"],
                ["Diagnostic Streaming", "#solutions"],
                ["Clinical E-Prescribing", "#clinical-architecture"],
              ]],
              ["Clinical Governance", [
                ["BMDC Verification", "#governance"],
                ["Audit Trail Console", "/admin"],
                ["Security Architecture", "#governance"],
                ["RBAC Policies", "#governance"],
              ]],
              ["Support & Portal", [
                ["Physician Sign In", "/login?role=doctor"],
                ["Patient Sign In", "/login?role=patient"],
                ["Register Clinic", "/register"],
                ["Security Overview", "#governance"],
              ]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <p className="text-sm font-bold text-ink-900">{title as string}</p>
                <ul className="mt-4 space-y-2.5">
                  {(links as [string, string][]).map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith('#') ? (
                        <a
                          href={href}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.querySelector(href);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-sm text-ink-600 cursor-pointer transition-colors hover:text-primary-700"
                        >
                          {label}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(href)}
                          className="text-sm text-ink-600 cursor-pointer transition-colors hover:text-primary-700 text-left"
                        >
                          {label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-hair pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MedraLink Health Technologies. University of Information Technology &amp; Sciences (UITS).</p>
            <div className="flex gap-5 text-ink-600">
              <a
                href="#governance"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#governance')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-primary-700 cursor-pointer transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#governance"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#governance')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-primary-700 cursor-pointer transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#governance"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#governance')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-primary-700 cursor-pointer transition-colors"
              >
                Security Overview
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
