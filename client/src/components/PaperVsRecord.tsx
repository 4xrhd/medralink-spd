import React from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { Icon } from '../ui/primitives.js';

/*
 * Before and after for the landing page: a pile of loose paper slips (the allergy note buried
 * at the bottom) next to the same history as one MedraLink record with the allergy on top.
 * Sample names and values only; the drawing is decorative and hidden from screen readers.
 */

interface Slip {
  lines: string[];
  heading: string;
  /** Tailwind position and rotation classes; static strings so Tailwind can see them. */
  place: string;
  tone?: 'allergy';
}

const SLIPS: Slip[] = [
  { heading: 'Allergy note', lines: ['Penicillin: urticaria,', 'angioedema (2018)'], place: 'left-[6%] top-[52%] -rotate-[7deg] z-0', tone: 'allergy' },
  { heading: 'Lab report', lines: ['Total cholesterol 218 mg/dL', 'S. creatinine 0.9 mg/dL'], place: 'left-[30%] top-[38%] rotate-[5deg] z-10' },
  { heading: 'Rx  10.08.2026', lines: ['Tab. Amlocard 5 mg', '1+0+0  30 days'], place: 'left-[2%] top-[8%] rotate-[-3deg] z-20' },
  { heading: 'Rx  10.08.2026', lines: ['Tab. Napa Extra', '1+0+1  5 days'], place: 'right-[4%] top-[4%] rotate-[8deg] z-20' },
  { heading: 'BP chart', lines: ['145/92 mmHg  pulse 78', 'Square Hospital, Rm 402'], place: 'right-[8%] bottom-[6%] -rotate-[4deg] z-30' },
];

/* Rahim Ahmed's seeded history (P-1001), newest first. */
const RECORD: { date: string; title: string; detail: string; icon: React.ReactNode }[] = [
  { date: '11 Aug 2026', title: 'Lipid profile & serum creatinine', detail: 'TC 218 mg/dL, creatinine 0.9 mg/dL', icon: <Icon.File size={14} /> },
  { date: '10 Aug 2026', title: 'Hypertension review, Dr. Ahmed Tariq', detail: 'BP 145/92; Tab. Amlocard 5 mg, 1+0+0', icon: <Icon.Stethoscope size={14} /> },
  { date: '10 Mar 2021', title: 'Essential hypertension diagnosed', detail: 'ICD-10 I10, managed', icon: <Icon.Pulse size={14} /> },
];

function PaperPile() {
  return (
    <div className="relative h-56 sm:h-64" aria-hidden="true">
      {SLIPS.map((s, i) => (
        <div
          key={i}
          className={`absolute w-[46%] max-w-[13rem] rounded-sm border px-3 py-2.5 shadow-[0_1px_2px_rgb(20_33_28/0.12)] ${s.place} ${
            s.tone === 'allergy' ? 'border-red-200 bg-[#FFF8F6]' : 'border-[#E4E1D8] bg-[#FDFCF8]'
          }`}
        >
          <p className={`font-display text-xs font-semibold ${s.tone === 'allergy' ? 'text-critical' : 'text-ink-900'}`}>{s.heading}</p>
          {s.lines.map((l) => (
            <p key={l} className="mt-0.5 truncate font-mono text-[0.6875rem] leading-snug text-ink-600">{l}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

function RecordCard() {
  const { t: tr } = useLanguage();
  return (
    <div className="rounded-xl border border-hair bg-surface p-4 sm:p-5" aria-hidden="true">
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-critical">
        <Icon.Alert size={15} className="shrink-0" />
        <span>{tr('Allergy: Penicillin (severe)')}</span>
      </div>
      <ol className="mt-4 ml-2.5 space-y-3 border-l border-primary-200 pl-6">
        {RECORD.map((r) => (
          <li key={r.title} className="relative">
            <span className="absolute -left-[2.125rem] top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary-700 text-white">{r.icon}</span>
            <p className="text-xs text-ink-600 tabular">{tr(r.date)}</p>
            <p className="text-sm font-semibold text-ink-900">{tr(r.title)}</p>
            <p className="font-mono text-xs text-ink-600">{r.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export const PaperVsRecord: React.FC = () => {
  const { t: tr } = useLanguage();
  return (
    <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
      {/* Before */}
      <figure className="flex flex-col rounded-2xl border border-dashed border-hair-strong bg-canvas p-5 sm:p-6">
        <PaperPile />
        <figcaption className="mt-6 grid gap-5 border-t border-hair pt-5 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">{tr('Lost between visits')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              {tr('Old prescriptions and test results go missing, so tests get repeated and the next doctor starts from scratch.')}
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">{tr('Allergies nobody saw')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              {tr('Without past records, a doctor can prescribe something the patient has already reacted to.')}
            </p>
          </div>
        </figcaption>
      </figure>

      <div className="grid place-items-center text-primary-700" aria-hidden="true">
        <span className="grid h-10 w-10 rotate-90 place-items-center rounded-full border border-primary-200 bg-surface lg:rotate-0">
          <Icon.Arrow size={18} />
        </span>
      </div>

      {/* After */}
      <figure className="flex flex-col rounded-2xl bg-primary-700 p-5 text-white sm:p-6">
        <RecordCard />
        <figcaption className="mt-6 border-t border-white/20 pt-5">
          <h3 className="font-display text-lg font-semibold">{tr('One record that follows you')}</h3>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-primary-50">
            {tr('Every consultation, prescription and lab report in one timeline, visible only to you and the doctors treating you. Allergies show first, every time.')}
          </p>
        </figcaption>
      </figure>
    </div>
  );
};
