import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Card, Icon, Pill, Button, VitalPill } from '../ui/primitives.js';

export const LandingPage: React.FC = () => {
  useDocumentTitle('Unified Prescription & Health Network');
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
      title: "Rapid clinical documentation, structured for continuity",
      features: [
        ["Rapid ICD-10 Codification", "Quick-select diagnosis chips backed by a searchable ICD-10 database."],
        ["Dynamic E-Prescribing", "Structured medication tables with dosage, frequency and duration validation."],
        ["Vitals Capture Matrix", "Real-time BMI computation and threshold-aware telemetry entry."],
        ["Digital Signature", "Finalize, cryptographically sign and issue an official prescription in one step."],
      ],
    },
    {
      title: "A longitudinal health record patients can actually read",
      features: [
        ["Longitudinal Timeline", "Every consultation rendered on a continuous vertical health timeline."],
        ["Laboratory Streaming", "Diagnostic reports attached and viewable directly against each visit."],
        ["Allergy & Condition Alerts", "Prominent safety strips surface allergies and chronic conditions."],
        ["Official PDF Export", "Download legally valid prescription sheets with verification QR codes."],
      ],
    },
    {
      title: "Governance and compliance held to enterprise standards",
      features: [
        ["Physician Accreditation", "Verify and revoke BMDC credentials with instant status pills."],
        ["Append-Only Audit Ledger", "Every action written to an immutable, SHA-256 integrity trail."],
        ["RBAC Enforcement", "Role-scoped access across doctors, patients and administrators."],
        ["Platform Telemetry", "Live uptime, record volume and audit-entry KPIs at a glance."],
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
    <div className="bg-canvas">
      {/* Hero Section */}
      <section id="hero" className="mx-auto grid max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 items-center gap-12 2xl:gap-16 px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] 2xl:grid-cols-[1.15fr_0.85fr] lg:py-20">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-[56px]">
            One Unified Record.<br />
            Seamless Clinical Continuity.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
            Eliminate fragmented medical history and paper-based slips. MedraLink empowers physicians,
            clinics, and diagnostic centers with instant, role-secured access to longitudinal patient
            health timelines.
          </p>
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
            >
              Explore Patient Timeline
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {[
              ["<200ms", "Query Latency"],
              ["100%", "3NF Relational Integrity"],
              ["Zero", "Blockchain Overhead"],
            ].map(([a, b]) => (
              <div key={b} className="flex items-baseline gap-2">
                <span className="tabular font-display text-base font-bold text-success">{a}</span>
                <span className="text-ink-600">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating consultation preview */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-primary-50 to-transparent" />
          <Card className="relative -rotate-1 p-5 shadow-[0_24px_60px_-20px_rgba(27,54,93,0.35)]">
            <div className="flex items-center justify-between border-b border-hair pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-700 text-white">
                  <Icon.Stethoscope size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-900">Consultation Workstation</p>
                  <p className="text-[10px] text-ink-400">Rahim Ahmed • P-1001</p>
                </div>
              </div>
              <Pill tone="emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
              </Pill>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <VitalPill label="Blood Pressure" value="120/80" tone="slate" />
              <VitalPill label="Pulse" value="74 bpm" tone="slate" />
              <VitalPill label="SpO₂" value="99%" tone="emerald" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500">
                Codified Diagnosis
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill tone="blue">[I10] Hypertension</Pill>
                <Pill tone="slate">[E11] T2 Diabetes</Pill>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                <Icon.Pill size={14} /> Digital Prescription Sheet
              </div>
              <div className="space-y-1 text-xs text-ink-900">
                <div className="flex justify-between tabular">
                  <span>Tab. Amlocard 5mg</span>
                  <span className="font-mono text-ink-600">1+0+0</span>
                </div>
                <div className="flex justify-between tabular">
                  <span>Tab. Napa Extra</span>
                  <span className="font-mono text-ink-600">1+0+1</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Impact Bar */}
      <section id="network-clinics" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["40% Faster", "History Review Time"],
            ["100% Elimination", "of Paper Prescription Loss"],
            ["Sub-200ms", "Record Query Execution"],
            ["Bank-Grade", "Cryptographic Audit Security"],
          ].map(([a, b]) => (
            <Card key={b} className="p-6">
              <p className="font-display text-2xl font-bold text-primary-700">{a}</p>
              <p className="mt-1 text-sm text-ink-600">{b}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Problem vs MedraLink Grid */}
      <section id="solutions" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-900">
            From fragmented records to one continuous timeline
          </h2>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              image: "/assets/data_fragmentation.png",
              imageAlt: "Fragmented physical medical records and prescriptions",
              accent: "#DC2626",
              headerBg: "bg-rose-50/70 border-b border-rose-100/70",
              title: "Fragmented Paper Slips",
              body: "Clinical data is lost between visits, forcing repetitive diagnostic testing and inflating patient costs. No physician sees the full picture.",
              tag: "Data Fragmentation",
            },
            {
              image: "/assets/drug_interaction.png",
              imageAlt: "Pharmaceutical bottles with alert badge illustrating contraindications",
              accent: "#D97706",
              headerBg: "bg-amber-50/70 border-b border-amber-100/70",
              title: "Medication Safety Hazards",
              body: "Unreviewed allergies and drug interactions lead to severe adverse reactions when prescribing physicians lack historical context.",
              tag: "Clinical Risk",
            },
            {
              image: "/assets/unified_timeline.png",
              imageAlt: "Connected digital medical timeline ribbon with diagnostic nodes",
              accent: "#059669",
              headerBg: "bg-emerald-50/70 border-b border-emerald-100/70",
              title: "MedraLink Unified Timeline",
              body: "A single, continuous medical history accessible under strict role-based access control — every consultation, prescription, and lab in one record.",
              tag: "Verified Solution",
            },
          ].map((c) => (
            <Card
              key={c.title}
              className="group flex flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{ borderTopWidth: 3, borderTopColor: c.accent }}
            >
              <div className={`flex h-40 w-full items-center justify-center p-4 ${c.headerBg}`}>
                <img
                  src={c.image}
                  alt={c.imageAlt}
                  className="max-h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="text-xs font-semibold" style={{ color: c.accent }}>
                  {c.tag}
                </span>
                <h3 className="mt-1.5 font-display text-xl font-bold text-ink-900">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{c.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Role-based clinical workspaces */}
      <section id="clinical-architecture" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
            Role-based clinical workspaces
          </h2>
          <p className="mt-2 text-sm sm:text-base text-ink-600">
            Tailored interfaces engineered specifically for physicians, patients, and clinical administrators.
          </p>
        </div>

        {/* Centered Segmented Control Tab Bar */}
        <div className="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Clinical workspace features"
            className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-hair bg-primary-50/60 p-1.5 shadow-2xs"
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
                    ? "bg-primary-700 text-white shadow-sm"
                    : "text-ink-600 hover:text-ink-900 hover:bg-white/60"
                }`}
              >
                <span className={tab === i ? "text-blue-300" : "text-ink-600"}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Card id={`workspace-panel-${tab}`} role="tabpanel" className="mt-8 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hair pb-5">
            <div>
              <span className="text-xs font-semibold text-primary-600">
                {tabs[tab].label}
              </span>
              <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-ink-900">
                {content[tab].title}
              </h3>
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
                Access Audit Console
              </Button>
            )}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {content[tab].features.map(([t, b]) => (
              <div
                key={t}
                className="flex gap-3.5 rounded-xl border border-hair bg-canvas p-4.5 transition-all hover:bg-white hover:border-hair-strong hover:shadow-xs"
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

      {/* Security & Compliance Banner */}
      <section id="governance" className="scroll-mt-24 bg-primary-700 py-16 text-white">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12">
          <p className="text-xs font-semibold text-blue-200">
            Enterprise Security &amp; Compliance
          </p>
          <h2 className="mt-2 max-w-2xl font-display text-4xl font-bold tracking-tight">
            Bank-grade protection for every patient record
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Role-Based Access Control", "Strict RBAC scoping every record to authorized clinical roles.", <Icon.Lock size={20} />],
              ["TLS 1.3 & AES-256", "Encryption in transit and at rest across the entire platform.", <Icon.Shield size={20} />],
              ["SQL Injection Defense", "Parameterized queries and prepared statements everywhere.", <Icon.File size={20} />],
              ["Immutable Audit Ledger", "Append-only cryptographic ledger of every clinical action.", <Icon.Pulse size={20} />],
            ].map(([t, b, icon]) => (
              <div key={t as string} className="rounded-2xl border border-white/10 bg-white/5 p-6">
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

      {/* Enterprise Footer */}
      <footer id="support" className="scroll-mt-24 bg-ink-900 text-slate-300">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-14">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white">
                  <Icon.Cross size={18} />
                </div>
                <span className="font-display text-lg font-extrabold text-white">MedraLink</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                Enterprise EMR &amp; clinical workflow infrastructure for physicians, clinics and diagnostic
                networks.
              </p>
            </div>
            {[
              ["Brand & Accreditation", [
                ["About MedraLink", "#hero"],
                ["BMDC Compliance", "#governance"],
                ["Accreditation Registry", "#clinical-architecture"],
                ["Platform Telemetry", "#network-clinics"],
              ]],
              ["Platform Solutions", [
                ["Physician Workstation", "/doctor"],
                ["Patient Portal", "/patient"],
                ["Diagnostic Streaming", "#solutions"],
                ["E-Prescribing", "#clinical-architecture"],
              ]],
              ["Governance & Compliance", [
                ["Data Governance", "#governance"],
                ["Audit Ledger", "/admin"],
                ["Security Overview", "#governance"],
                ["RBAC Policy", "#governance"],
              ]],
              ["Enterprise Support", [
                ["Clinic Onboarding", "/register"],
                ["Portal Login", "/login"],
                ["Contact Sales", "#support"],
                ["Service Status", "#support"],
              ]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <p className="text-sm font-semibold text-white">{title as string}</p>
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
                          className="text-sm text-slate-400 cursor-pointer transition-colors hover:text-white"
                        >
                          {label}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(href)}
                          className="text-sm text-slate-400 cursor-pointer transition-colors hover:text-white text-left"
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
          <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MedraLink Health Technologies Ltd. All rights reserved.</p>
            <div className="flex gap-5">
              <a
                href="#governance"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#governance')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-white cursor-pointer transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#governance"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#governance')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-white cursor-pointer transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#governance"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#governance')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-white cursor-pointer transition-colors"
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
