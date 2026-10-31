import { useLanguage } from '../context/LanguageContext.js';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Card, Icon, Button, VitalPill } from '../ui/primitives.js';
import { EcgLine, SectionHeading, StepCard } from '../ui/medical.js';
import { PaperVsRecord } from '../components/PaperVsRecord.js';

const FAQ: [string, string][] = [
  ['Is MedraLink free for patients?', 'Yes. Patients can create an account, view their timeline and download prescriptions at no cost.'],
  ['Who can see my medical record?', 'You, and doctors who have had a consultation with you. Other patients and doctors who have not treated you cannot open it.'],
  ['How are doctors verified?', 'Doctors register with their BMDC registration number. An administrator checks it before the account can write prescriptions.'],
  ['Can a pharmacy check that a prescription is real?', 'Each prescription PDF has a QR code that links to the issued prescription, so it can be compared with the paper copy.'],
  ['What happens to my old paper reports?', 'You can upload lab reports as PDF or image files. They are attached to your record and served only to you and your doctors.'],
];

/** Illustrative screens for each workspace tab; sample names only, no real patient data. */
const WORKSPACE_MOCKUPS = [
  { src: '/mockups/doctor-workspace.webp', alt: 'Doctor workspace: patient allergy alert, vitals and a prescription table ready to sign' },
  { src: '/mockups/patient-timeline.webp', alt: 'Patient timeline: past visits with prescriptions, latest vitals and lab reports' },
  { src: '/mockups/admin-audit.webp', alt: 'Admin console: doctor accreditation list and a verified audit trail' },
];

export const LandingPage: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('MedraLink | Connected Health Records for Patients and Doctors'));
    const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: "For doctors", icon: <Icon.Stethoscope size={16} /> },
    { label: "For patients", icon: <Icon.User size={16} /> },
    { label: "For administrators", icon: <Icon.Shield size={16} /> },
  ];

  const content = [
    {
      title: "Write a consultation once, and it stays with the patient",
      subtitle: "Built for busy outpatient chambers: less retyping, fewer missed details.",
      features: [
        ["ICD-10 diagnosis search", "Find and attach diagnosis codes as you type instead of looking them up."],
        ["Structured prescriptions", "Dose, frequency, meal timing and duration in fixed fields, checked before issuing."],
        ["Vitals with automatic BMI", "Blood pressure, pulse and SpO2 flagged when they fall outside normal ranges."],
        ["Previous visits at a glance", "See allergies, conditions and past prescriptions before you prescribe."],
      ],
    },
    {
      title: "One health history you can read and carry",
      subtitle: "Every consultation, prescription and lab report in date order, on any device.",
      features: [
        ["Visit timeline", "Each consultation in order, with the diagnosis, medicines and notes from that visit."],
        ["Lab reports with each visit", "Upload a report once and it sits next to the consultation it belongs to."],
        ["Allergy warnings", "Known allergies and chronic conditions shown at the top of your record."],
        ["Prescription PDF with QR code", "Download a prescription a pharmacy can check by scanning its QR code."],
      ],
    },
    {
      title: "Control who can see what",
      subtitle: "Each role sees only the records it needs, and every change is logged.",
      features: [
        ["Doctor verification", "New doctors are checked against their BMDC registration before they can prescribe."],
        ["Tamper-evident audit log", "Each record change is chained with SHA-256, so edits to history show up on verification."],
        ["Role-based access", "Doctors, patients and administrators get separate permissions enforced on the server."],
        ["Account management", "Suspend or reactivate users and adjust platform settings from one panel."],
      ],
    },
  ];

  const dashboardPath = user ? ({ DOCTOR: '/doctor', PATIENT: '/patient', ADMIN: '/admin' } as const)[user.role] : null;

  const onTabKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (tab + step + tabs.length) % tabs.length;
    setTab(next);
    document.getElementById(`workspace-tab-${next}`)?.focus();
  };

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
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-900 leading-[1.12] text-balance">
              {tr("Your complete health record, in one caring place.")}
            </h1>

            <p className="mt-5 max-w-xl text-base sm:text-lg lg:text-xl leading-relaxed text-ink-600">
              {tr("Every consultation, prescription and lab report in one timeline that you and your doctors can open from any device.")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              {dashboardPath ? (
                <Button
                  size="lg"
                  onClick={() => navigate(dashboardPath)}
                  icon={<Icon.Arrow size={16} />}
                  iconPosition="right"
                  className="w-full sm:w-auto justify-center"
                >
                  {tr("Open your dashboard")}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate('/register')}
                    icon={<Icon.Arrow size={16} />}
                    iconPosition="right"
                    className="w-full sm:w-auto justify-center"
                  >
                    {tr("Create a free account")}
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto justify-center"
                  >
                    {tr("Sign in")}
                  </Button>
                </>
              )}
            </div>
            {!dashboardPath && (
              <p className="mt-3 text-sm text-ink-600">{tr("Free for patients. Doctors are verified before they can prescribe.")}</p>
            )}

            
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-hair pt-6 text-sm text-ink-600">
              <div className="flex items-center gap-2 font-medium">
                <Icon.ShieldPlus size={16} className="text-primary-700 shrink-0" />
                <span>{tr("BMDC-verified doctors")}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Icon.Lock size={16} className="text-primary-700 shrink-0" />
                <span>{tr("Encrypted in transit")}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Icon.Capsule size={16} className="text-primary-700 shrink-0" />
                <span>{tr("QR-checked prescriptions")}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Icon.HeartPulse size={16} className="text-primary-700 shrink-0" />
                <span>{tr("One lifelong record")}</span>
              </div>
            </div>
          </div>

          {/* Floating Live Consultation Workstation Preview */}
          <div className="relative z-10 space-y-4" aria-label={tr("Example consultation screen")} role="img">
            {/* Real Photographic Clinical Chamber Preview */}
            <div className="overflow-hidden rounded-2xl border border-hair bg-surface shadow-card group">
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-slate-100">
                <img
                  src="/images/hero/hero-consultation.webp"
                  alt={tr("Dr. Ahmed Tariq consulting with patient in modern clinical chamber")}
                  width={1200}
                  height={805}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent" aria-hidden="true" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white">
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src="/images/doctors/dr-ahmed.webp"
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold leading-tight">{tr("Dr. Ahmed Tariq, MBBS, FCPS")}</p>
                      <p className="hidden truncate text-[0.6875rem] text-slate-200 min-[400px]:block">{tr("Chief Cardiologist | Consultation Chamber")}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-300 backdrop-blur-sm shrink-0 whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" /> {tr("Live Session")}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Telemetry & Digital Prescription Card */}
            <Card className="relative p-5 shadow-card hover:shadow-card-hover border-hair bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-hair pb-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src="/images/doctors/dr-ahmed.webp"
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-primary-200"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink-900">{tr("Dr. Ahmed Tariq, MBBS")}</p>
                    <div className="flex items-center gap-1.5 text-xs text-ink-600">
                      <img
                        src="/images/patients/patient-rahim.webp"
                        alt=""
                        className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
                      />
                      <span>Patient: Rahim Ahmed, P-1001</span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> {tr("In progress")}
                </span>
              </div>

              {/* Vitals Telemetry Row */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <VitalPill label={tr("Blood Pressure")} value="145/92" tone="amber" />
                <VitalPill label={tr("Pulse")} value="78 bpm" tone="slate" />
                <VitalPill label={tr("SpO₂")} value="98%" tone="emerald" />
              </div>

              {/* Diagnosis Row */}
              <div className="mt-4">
                <p className="text-xs font-bold text-ink-400">
                  {tr("Diagnosis (ICD-10)")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    [I10] Essential Hypertension
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-critical">
                    <Icon.Alert size={12} /> {tr("Penicillin allergy")}
                  </span>
                </div>
              </div>

              {/* Digital Prescription Preview Card */}
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Icon.Capsule size={15} /> {tr("Prescription")}
                  </div>
                  <span className="font-mono text-[0.625rem] text-emerald-700">{tr("QR code attached")}</span>
                </div>
                <div className="space-y-1.5 text-xs text-ink-900 font-medium">
                  <div className="flex flex-wrap justify-between gap-x-3 tabular">
                    <span>{tr("Tab. Amlocard 5mg (Amlodipine)")}</span>
                    <span className="font-mono text-ink-600">1+0+0, 30 days</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 tabular">
                    <span>{tr("Tab. Napa Extra (Paracetamol/Caffeine)")}</span>
                    <span className="font-mono text-ink-600">1+0+1, 5 days if headache</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem vs MedraLink Solution */}
      <section id="solutions" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-16">
        <SectionHeading
          title={tr("Paper slips get lost. Your history should not.")}
          subtitle={tr("Most patients carry their medical history in a bag of loose prescriptions. MedraLink replaces that with one record every doctor you visit can read.")}
        />

        <PaperVsRecord />
      </section>

      {/* How It Works - The Care Journey */}
      <section id="how-it-works" className="scroll-mt-24 bg-primary-50/40 border-y border-hair py-14 sm:py-20">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12">
          <SectionHeading
            align="center"
            title={tr("How it works")}
            subtitle={tr("Three steps from first sign-up to a record that keeps itself up to date.")}
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <StepCard
              step={1}
              icon={<Icon.IdCard size={20} className="text-primary-700" />}
              title={tr("Create your account")}
              description={tr("Patients get a Health ID that links every future consultation, lab report and allergy to one record. Doctors register with their BMDC number.")}
            />
            <StepCard
              step={2}
              icon={<Icon.Stethoscope size={20} className="text-primary-700" />}
              title={tr("See the doctor")}
              description={tr("The doctor reads your history, records vitals and diagnosis, and issues the prescription from the same screen.")}
            />
            <StepCard
              step={3}
              icon={<Icon.ClipboardHeart size={20} className="text-primary-700" />}
              title={tr("Keep it with you")}
              description={tr("The visit appears on your timeline right away. Download the prescription, and a pharmacy can check it by scanning the QR code.")}
            />
          </div>
        </div>
      </section>

      {/* Role-Based Clinical Workspaces */}
      <section id="clinical-architecture" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-14 sm:py-20">
        <SectionHeading
          align="center"
          title={tr("A workspace for each role")}
          subtitle={tr("Doctors, patients and administrators each get a screen built around what they do.")}
        />

        {/* Centered Segmented Control Tab Bar */}
        <div className="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label={tr("Workspaces")}
            onKeyDown={onTabKey}
            className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-xl border border-hair bg-primary-50/70 p-1.5"
          >
            {tabs.map((t, i) => (
              <button
                key={t.label}
                id={`workspace-tab-${i}`}
                type="button"
                role="tab"
                tabIndex={tab === i ? 0 : -1}
                aria-selected={tab === i}
                aria-controls={`workspace-panel-${i}`}
                onClick={() => setTab(i)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  tab === i
                    ? "bg-primary-700 text-white shadow-sm"
                    : "text-ink-600 hover:text-ink-900 hover:bg-white/80"
                }`}
              >
                <span className={tab === i ? "text-primary-100" : "text-primary-700"}>{t.icon}</span>
                <span>{tr(t.label)}</span>
              </button>
            ))}
          </div>
        </div>

        <Card id={`workspace-panel-${tab}`} role="tabpanel" aria-labelledby={`workspace-tab-${tab}`} className="mt-8 p-6 sm:p-8 border-hair">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hair pb-5">
            <div>
              <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-ink-900">
                {tr(content[tab].title)}
              </h3>
              <p className="mt-1.5 text-sm sm:text-base text-ink-600 leading-relaxed">
                {tr(content[tab].subtitle)}
              </p>
            </div>
            <Button
              size="sm"
              variant={tab === 2 ? 'secondary' : 'primary'}
              onClick={[handleLaunchDoctor, handleLaunchPatient, handleLaunchAdmin][tab]}
              icon={<Icon.Arrow size={14} />}
              iconPosition="right"
              className="shrink-0"
            >
              {tr(['Open doctor workspace', 'Open my health record', 'Open admin console'][tab])}
            </Button>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
            <figure className="overflow-hidden rounded-xl border border-hair bg-canvas">
              <img
                key={WORKSPACE_MOCKUPS[tab].src}
                src={WORKSPACE_MOCKUPS[tab].src}
                alt={tr(WORKSPACE_MOCKUPS[tab].alt)}
                width={1200}
                height={896}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full animate-menu-in motion-reduce:animate-none"
              />
            </figure>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {content[tab].features.map(([t, b]) => (
              <div
                key={t}
                className="flex gap-3.5 rounded-xl border border-hair bg-canvas p-4"
              >
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
                  <Icon.Check size={15} />
                </div>
                <div>
                  <p className="text-base font-semibold text-ink-900">{tr(t)}</p>
                  <p className="mt-1 text-sm text-ink-600 leading-relaxed">{tr(b)}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </Card>
      </section>

      {/* Enterprise Security & Compliance Banner */}
      <section id="governance" className="scroll-mt-24 bg-primary-900 py-16 text-white">
        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12">
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {tr("Privacy built into every patient record")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Only your doctors", "A doctor can open your record only after treating you. Other users never see it.", <Icon.Lock size={20} />],
              ["Encrypted traffic", "Traffic is encrypted in transit and passwords are stored only as bcrypt hashes.", <Icon.Shield size={20} />],
              ["Files behind sign-in", "Lab reports and prescription PDFs are served only to signed-in users allowed to see them.", <Icon.File size={20} />],
              ["Every change logged", "Record changes are written to a hash-chained audit log that administrators can verify.", <Icon.Pulse size={20} />],
            ].map(([t, b, icon]) => (
              <div key={t as string} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-primary-200">
                  {icon}
                </div>
                <p className="mt-4 font-display text-lg font-semibold">{tr(t as string)}</p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-slate-300">{tr(b as string)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Connected Healthcare Facilities & Emergency Network */}
      <section id="hospitals-network" className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] scroll-mt-24 px-4 sm:px-6 lg:px-8 2xl:px-12 py-14 sm:py-20 border-t border-hair">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <SectionHeading
            title={tr("Hospitals near you")}
            subtitle={tr("Find the nearest government and private hospitals across Bangladesh, with directions, from OpenStreetMap data.")}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/hospitals')}
            icon={<Icon.Arrow size={14} />}
            iconPosition="right"
            className="shrink-0 self-start sm:self-auto"
          >
            {tr("Search 2,100+ hospitals")}
          </Button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Dhaka Medical College Hospital",
              category: "Government general hospital",
              image: "/images/hospitals/general-hospital.webp",
              location: "Secretariat Road, Dhaka",
              tag: "24/7 emergency",
            },
            {
              name: "National Institute of Cardiovascular Diseases (NICVD)",
              category: "Government heart hospital",
              image: "/images/hospitals/cardiac-center.webp",
              location: "Sher-e-Bangla Nagar, Dhaka",
              tag: "Cardiology",
            },
            {
              name: "National Institute of Traumatology & Orthopaedic Rehabilitation (NITOR)",
              category: "Government trauma and orthopaedic hospital",
              image: "/images/hospitals/trauma-center.webp",
              location: "Agargaon Road, Dhaka",
              tag: "Trauma & orthopaedics",
            },
          ].map((h) => (
            <Card key={h.name} className="flex flex-col overflow-hidden p-0 border-hair group">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                <img
                  src={h.image}
                  alt=""
                  width={960}
                  height={536}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute top-3 left-3 rounded-md bg-ink-900/80 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                  {tr(h.tag)}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-semibold text-primary-700">{tr(h.category)}</span>
                <h3 className="mt-1 font-display text-lg font-bold text-ink-900">{tr(h.name)}</h3>
                <p className="mt-1 mb-4 text-xs text-ink-600 flex items-center gap-1.5">
                  <Icon.Cross size={13} className="text-primary-600 shrink-0" />
                  <span>{tr(h.location)}</span>
                </p>
                <div className="mt-auto pt-4 border-t border-hair flex items-center justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => navigate('/hospitals')}
                    className="-mr-2 inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 font-semibold text-primary-700 transition-colors hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  >
                    <span>{tr("Show on map")}</span>
                    <Icon.Arrow size={12} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <SectionHeading align="center" title={tr("Questions people ask")} />
        <div className="mt-10 divide-y divide-hair rounded-xl border border-hair bg-surface">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-5 py-4 sm:px-6">
              <summary className="flex min-h-[44px] cursor-pointer text-base list-none items-center justify-between gap-4 rounded font-semibold text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700 [&::-webkit-details-marker]:hidden">
                {tr(q)}
                <Icon.Chevron size={18} className="shrink-0 text-ink-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-base leading-relaxed text-ink-600">{tr(a)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12 pb-14 sm:pb-18">
        <div className="rounded-xl bg-primary-800 p-8 sm:p-12 text-white">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              {tr("Bring your records together")}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-primary-50 leading-relaxed">
              {tr("Patients sign up in a minute. Doctors register with their BMDC number and start after verification.")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate(dashboardPath ?? '/register')}
                icon={<Icon.Arrow size={16} />}
                iconPosition="right"
              >
                {tr(dashboardPath ? 'Open your dashboard' : 'Create a free account')}
              </Button>
              {!dashboardPath && (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white/40 hover:bg-white/10"
                  onClick={() => navigate('/register?role=doctor')}
                >
                  {tr("Register as a doctor")}
                </Button>
              )}
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
            <span>{tr("Need urgent emergency medical assistance? Please dial 999 or proceed immediately to the nearest hospital emergency room.")}</span>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-14">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/logo-mark.png" alt={tr("MedraLink Logo")} className="h-9 w-9 object-contain" />
                <span className="font-display text-lg font-extrabold tracking-tight text-ink-900">
                  Medra<span className="text-primary-700">Link</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600">
                {tr("One medical record shared between patients and the doctors who treat them.")}
              </p>
            </div>

            {[
              ["Product", [
                ["How it works", "#how-it-works"],
                ["For doctors", "#clinical-architecture"],
                ["Security", "#governance"],
                ["FAQ", "#faq"],
              ]],
              ["Get started", [
                ["Create an account", "/register"],
                ["Register as a doctor", "/register?role=doctor"],
                ["Sign in", "/login"],
              ]],
              ["Find care", [
                ["Hospitals near you", "/hospitals"],
              ]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <p className="text-sm font-bold text-ink-900">{tr(title as string)}</p>
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
                          {tr(label)}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(href)}
                          className="text-sm text-ink-600 cursor-pointer transition-colors hover:text-primary-700 text-left"
                        >
                          {tr(label)}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-hair pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MedraLink. University of Information Technology &amp; Sciences (UITS).</p>
            <p>{tr("Built for CSE 416, Software Project Design and Development.")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
