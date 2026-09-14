import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Card, Icon, Pill, VitalPill } from '../ui/primitives.js';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, quickLogin } = useAuth();
  const [tab, setTab] = useState(0);

  const tabs = ["Physician Workstation", "Patient Health Portal", "Clinical Administration"];
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

  const handleLaunchDoctor = async () => {
    if (user?.role === 'DOCTOR') {
      navigate('/doctor');
    } else {
      await quickLogin('DOCTOR');
      navigate('/doctor');
    }
  };

  const handleLaunchPatient = async () => {
    if (user?.role === 'PATIENT') {
      navigate('/patient');
    } else {
      await quickLogin('PATIENT');
      navigate('/patient');
    }
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <section id="clinical-architecture" className="mx-auto grid max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 items-center gap-12 2xl:gap-16 px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] 2xl:grid-cols-[1.15fr_0.85fr] lg:py-20">
        <div>
          <Pill tone="blue" className="mb-6 max-w-full whitespace-normal leading-relaxed">
            <Icon.Shield size={13} /> Next-Gen EMR Infrastructure • BMDC &amp; Clinical Standards Compliant
          </Pill>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0F172A] sm:text-5xl lg:text-[56px]">
            One Unified Record.<br />
            Seamless Clinical Continuity.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#475569]">
            Eliminate fragmented medical history and paper-based slips. MedraLink empowers physicians,
            clinics, and diagnostic centers with instant, role-secured access to longitudinal patient
            health timelines.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLaunchDoctor}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#16294a]"
            >
              Launch Doctor Workstation <Icon.Arrow size={16} />
            </button>
            <button
              type="button"
              onClick={handleLaunchPatient}
              className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#1B365D] transition-colors hover:border-[#cbd5e1]"
            >
              Explore Patient Timeline
            </button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {[
              ["<200ms", "Query Latency"],
              ["100%", "3NF Relational Integrity"],
              ["Zero", "Blockchain Overhead"],
            ].map(([a, b]) => (
              <div key={b} className="flex items-baseline gap-2">
                <span className="tabular font-display text-base font-bold text-[#059669]">{a}</span>
                <span className="text-[#475569]">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating consultation preview */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-[#EFF6FF] to-transparent" />
          <Card className="relative -rotate-1 p-5 shadow-[0_24px_60px_-20px_rgba(27,54,93,0.35)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1B365D] text-white">
                  <Icon.Stethoscope size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0F172A]">Consultation Workstation</p>
                  <p className="text-[10px] text-[#94A3B8]">Rahim Ahmed • P-1001</p>
                </div>
              </div>
              <Pill tone="emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" /> Live
              </Pill>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <VitalPill label="Blood Pressure" value="120/80" tone="slate" />
              <VitalPill label="Pulse" value="74 bpm" tone="slate" />
              <VitalPill label="SpO₂" value="99%" tone="emerald" />
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Codified Diagnosis
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill tone="blue">[I10] Hypertension</Pill>
                <Pill tone="slate">[E11] T2 Diabetes</Pill>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#059669]">
                <Icon.Pill size={14} /> Digital Prescription Sheet
              </div>
              <div className="space-y-1 text-xs text-[#0F172A]">
                <div className="flex justify-between tabular">
                  <span>Tab. Amlocard 5mg</span>
                  <span className="font-mono text-[#475569]">1+0+0</span>
                </div>
                <div className="flex justify-between tabular">
                  <span>Tab. Napa Extra</span>
                  <span className="font-mono text-[#475569]">1+0+1</span>
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
              <p className="font-display text-2xl font-bold text-[#1B365D]">{a}</p>
              <p className="mt-1 text-sm text-[#475569]">{b}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Problem vs MedraLink Grid */}
      <section id="solutions" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">The Healthcare Problem</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#0F172A]">
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
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: c.accent }}>
                  {c.tag}
                </p>
                <h3 className="mt-1.5 font-display text-xl font-bold text-[#0F172A]">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#475569]">{c.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Role-based clinical workspaces */}
      <section className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-16">
        <h2 className="text-center font-display text-4xl font-bold tracking-tight text-[#0F172A]">
          Role-based clinical workspaces
        </h2>
        <div role="tablist" aria-label="Clinical workspace features" className="mx-auto mt-8 flex max-w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white p-1">
          {tabs.map((t, i) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === i}
              aria-controls={`workspace-panel-${i}`}
              onClick={() => setTab(i)}
              className={`shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                tab === i ? "bg-[#1B365D] text-white shadow-sm" : "text-[#475569] hover:text-[#1B365D]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Card id={`workspace-panel-${tab}`} role="tabpanel" className="mt-8 p-5 sm:p-8">
          <h3 className="font-display text-2xl font-bold text-[#0F172A]">{content[tab].title}</h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {content[tab].features.map(([t, b]) => (
              <div key={t} className="flex gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Icon.Check size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{t}</p>
                  <p className="mt-0.5 text-sm text-[#475569]">{b}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Security & Compliance Banner */}
      <section id="governance" className="scroll-mt-24 bg-[#1B365D] py-16 text-white">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#93C5FD]">
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
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#93C5FD]">
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
      <footer id="support" className="scroll-mt-24 bg-[#0F172A] text-slate-300">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-14">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#2563EB] text-white">
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
              ["Brand & Accreditation", ["About MedraLink", "BMDC Compliance", "Accreditation Registry", "Newsroom"]],
              ["Platform Solutions", ["Physician Workstation", "Patient Portal", "Diagnostic Streaming", "E-Prescribing"]],
              ["Governance & Compliance", ["Data Governance", "Audit Ledger", "Security Overview", "RBAC Policy"]],
              ["Enterprise Support", ["Clinic Onboarding", "Documentation", "Contact Sales", "Service Status"]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <p className="text-sm font-semibold text-white">{title as string}</p>
                <ul className="mt-4 space-y-2.5">
                  {(links as string[]).map((l) => (
                    <li key={l}>
                      <span className="text-sm text-slate-400 cursor-pointer transition-colors hover:text-white">
                        {l}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MedraLink Health Technologies Ltd. All rights reserved.</p>
            <div className="flex gap-5">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
              <span className="hover:text-white cursor-pointer">Security Overview</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
