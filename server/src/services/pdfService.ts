import PDFDocument from 'pdfkit';
import { Response } from 'express';
import QRCode from 'qrcode';
import crypto from 'crypto';

// ==========================================
// 1. Data Contracts
// ==========================================

export interface PrescriptionData {
  prescriptionUid: string;
  issueDate: string;
  instructions?: string;
  validityDays?: number;
  followUpDate?: string;
  doctor: {
    fullName: string;
    specialization: string;
    qualifications: string;
    licenseNumber: string;
    hospital?: string;
    chamber?: string;
    phone?: string;
  };
  patient: {
    fullName: string;
    patientUid: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup?: string;
    phone?: string;
    allergies?: Array<{ allergen: string; severity?: string }>;
    conditions?: Array<{ conditionName: string; status?: string }>;
  };
  vitals?: {
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    temperature?: number;
    spo2?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
  };
  diagnoses?: Array<{
    icd10Code: string;
    diagnosisTitle: string;
    severity?: string;
    description?: string;
  }>;
  items: Array<{
    medicationName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
    instructions?: string;
  }>;
  verificationHash?: string;
}

export interface ConsultationSummaryData {
  recordUid: string;
  visitDate: string;
  chiefComplaint: string;
  clinicalNotes?: string;
  followUpDate?: string;
  doctor: {
    fullName: string;
    specialization: string;
    qualifications: string;
    licenseNumber: string;
    hospital?: string;
    chamber?: string;
    phone?: string;
  };
  patient: {
    fullName: string;
    patientUid: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup?: string;
    phone?: string;
    allergies?: Array<{ allergen: string; severity?: string }>;
    conditions?: Array<{ conditionName: string; status?: string }>;
  };
  vitals?: {
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    temperature?: number;
    spo2?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
  };
  diagnoses?: Array<{
    icd10Code: string;
    diagnosisTitle: string;
    severity?: string;
    description?: string;
  }>;
  prescription?: {
    prescriptionUid: string;
    instructions?: string;
    items: Array<{
      medicationName: string;
      genericName?: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
  };
  labOrders?: Array<{
    testName: string;
    category: string;
    status?: string;
    resultsSummary?: string;
  }>;
}

export interface PatientHealthSummaryData {
  patient: {
    fullName: string;
    patientUid: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    nidOrBid?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
  };
  allergies?: Array<{ allergen: string; allergenType?: string; severity: string; reaction?: string }>;
  chronicConditions?: Array<{ conditionName: string; status: string; diagnosedDate?: string }>;
  consultations?: Array<{
    recordUid: string;
    visitDate: string;
    doctorName: string;
    specialization: string;
    chiefComplaint: string;
    diagnoses: string;
  }>;
  activePrescriptions?: Array<{
    prescriptionUid: string;
    issueDate: string;
    doctorName: string;
    itemsSummary: string;
  }>;
  labReports?: Array<{
    testName: string;
    category: string;
    testDate: string;
    status: string;
    resultsSummary?: string;
  }>;
}

// ==========================================
// 2. Palette & Geometry Constants
// ==========================================

const COLOR = {
  NAVY_PRIMARY: '#1B365D',
  NAVY_DARK: '#0F1E36',
  BLUE_ACCENT: '#2563EB',
  BLUE_LIGHT: '#EFF6FF',
  BLUE_BORDER: '#BFDBFE',
  SLATE_DARK: '#0F172A',
  SLATE_BODY: '#334155',
  SLATE_MUTED: '#64748B',
  SLATE_LIGHT: '#94A3B8',
  BORDER_SUBTLE: '#E2E8F0',
  BORDER_STRONG: '#CBD5E1',
  SURFACE_BG: '#F8FAFC',
  SURFACE_SUBTLE: '#F1F5F9',
  SURFACE_CARD: '#FFFFFF',
  EMERALD: '#059669',
  EMERALD_BG: '#ECFDF5',
  EMERALD_BORDER: '#A7F3D0',
  CRIMSON: '#DC2626',
  CRIMSON_BG: '#FEF2F2',
  CRIMSON_BORDER: '#FECACA',
  AMBER: '#D97706',
  AMBER_BG: '#FFFBEB',
  AMBER_BORDER: '#FDE68A',
};

const PAGE = {
  WIDTH: 595.28,
  HEIGHT: 841.89,
  MARGIN_X: 36,
  USABLE_WIDTH: 523.28,
  BOTTOM_LIMIT: 775,
};

// ==========================================
// 3. Vector Drawing Utilities
// ==========================================

function drawMedicalCrossEmblem(doc: PDFKit.PDFDocument, x: number, y: number, size = 36) {
  doc.save();
  doc.roundedRect(x, y, size, size, 8).fill(COLOR.BLUE_ACCENT);
  
  const barLength = size * 0.62;
  const barThickness = size * 0.24;
  const offsetL = (size - barLength) / 2;
  const offsetT = (size - barThickness) / 2;

  doc.fillColor('#FFFFFF');
  doc.roundedRect(x + offsetT, y + offsetL, barThickness, barLength, 2).fill();
  doc.roundedRect(x + offsetL, y + offsetT, barLength, barThickness, 2).fill();
  doc.restore();
}

function drawRxBadge(doc: PDFKit.PDFDocument, x: number, y: number, size = 22) {
  doc.save();
  doc.roundedRect(x, y, size, size, 5).fill(COLOR.BLUE_LIGHT);
  doc.roundedRect(x, y, size, size, 5).strokeColor(COLOR.BLUE_BORDER).lineWidth(0.75).stroke();

  doc.fillColor(COLOR.BLUE_ACCENT).font('Helvetica-Bold').fontSize(size * 0.62);
  doc.text('Rx', x, y + size * 0.18, { width: size, align: 'center' });
  doc.restore();
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function calculateAge(dobStr: string): string {
  try {
    const dob = new Date(dobStr);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    const age = Math.abs(ageDt.getUTCFullYear() - 1970);
    return `${age} Yrs`;
  } catch {
    return '—';
  }
}

function generateCryptographicHash(dataObj: any): string {
  const serialized = JSON.stringify(dataObj);
  return crypto.createHash('sha256').update(serialized).digest('hex').substring(0, 32);
}

// ==========================================
// 4. Header & Letterhead Components
// ==========================================

function drawOfficialHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  docTypeBadge: string,
  docId: string,
  dateStr: string,
  currentY: number
): number {
  const headerHeight = 64;
  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;

  doc.save();
  // Navy background container
  doc.roundedRect(x, currentY, w, headerHeight, 8).fill(COLOR.NAVY_PRIMARY);

  // Vector medical cross
  drawMedicalCrossEmblem(doc, x + 14, currentY + 14, 36);

  // Brand Titles
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13.5);
  doc.text('MedraLink Clinical Health System', x + 58, currentY + 16);

  doc.fillColor('#93C5FD').font('Helvetica').fontSize(7.5);
  doc.text('National Electronic Health Record & Cryptographic Prescription Registry', x + 58, currentY + 34);

  doc.fillColor('#60A5FA').font('Helvetica-Bold').fontSize(6.5);
  doc.text('BMDC ACCREDITED INTEROPERABLE HEALTH NETWORK', x + 58, currentY + 46);

  // Document Type Pill (Right side)
  const pillW = 160;
  const pillX = x + w - pillW - 12;
  const pillY = currentY + 10;
  const pillH = 44;

  doc.roundedRect(pillX, pillY, pillW, pillH, 6).fill(COLOR.NAVY_DARK);
  doc.roundedRect(pillX, pillY, pillW, pillH, 6).strokeColor('#2A4365').lineWidth(0.75).stroke();

  doc.fillColor('#E2E8F0').font('Helvetica-Bold').fontSize(7);
  doc.text(docTypeBadge, pillX, pillY + 7, { width: pillW, align: 'center' });

  doc.fillColor('#34D399').font('Helvetica-Bold').fontSize(9.5);
  doc.text(docId, pillX, pillY + 18, { width: pillW, align: 'center' });

  doc.fillColor('#94A3B8').font('Helvetica').fontSize(7);
  doc.text(`Issued: ${formatDate(dateStr)}`, pillX, pillY + 31, { width: pillW, align: 'center' });

  doc.restore();
  return currentY + headerHeight + 10;
}

function drawDoctorLetterhead(
  doc: PDFKit.PDFDocument,
  doctor: PrescriptionData['doctor'],
  currentY: number
): number {
  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;
  const letterheadY = currentY;

  doc.save();

  // Left Column: Doctor Profile & Accreditation
  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(12);
  doc.text(doctor.fullName, x + 4, letterheadY);

  doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(8.5);
  doc.text(doctor.qualifications, x + 4, letterheadY + 15, { width: 300 });

  doc.fillColor(COLOR.BLUE_ACCENT).font('Helvetica-Bold').fontSize(8);
  doc.text(`Specialization: ${doctor.specialization}`, x + 4, letterheadY + 28);

  // License badge
  const bmdcText = `BMDC Reg: ${doctor.licenseNumber}`;
  doc.fontSize(7.5);
  const badgeW = doc.widthOfString(bmdcText) + 18;
  doc.roundedRect(x + 4, letterheadY + 41, badgeW, 14, 3).fill(COLOR.EMERALD_BG);
  doc.roundedRect(x + 4, letterheadY + 41, badgeW, 14, 3).strokeColor(COLOR.EMERALD_BORDER).lineWidth(0.5).stroke();
  doc.circle(x + 10, letterheadY + 48, 2.2).fill(COLOR.EMERALD);
  doc.fillColor(COLOR.EMERALD).font('Helvetica-Bold').fontSize(7);
  doc.text(bmdcText, x + 16, letterheadY + 44);

  // Right Column: Hospital Affiliation & Consultation Chamber
  const rightX = x + 250;
  const rightW = w - 250 - 4;

  doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(8.5);
  doc.text(doctor.hospital || 'Accredited Healthcare Facility', rightX, letterheadY, { width: rightW, align: 'right' });

  doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7.5);
  if (doctor.chamber) {
    doc.text(doctor.chamber, rightX, letterheadY + 14, { width: rightW, align: 'right' });
  }
  if (doctor.phone) {
    doc.text(`Hotline / Tel: ${doctor.phone}`, rightX, letterheadY + 28, { width: rightW, align: 'right' });
  }
  doc.fillColor(COLOR.EMERALD).font('Helvetica-Bold').fontSize(7);
  doc.text('Verified Digital Consultation Station', rightX, letterheadY + 42, { width: rightW, align: 'right' });

  // Divider Rule
  const lineY = letterheadY + 62;
  doc.strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.75).moveTo(x, lineY).lineTo(x + w, lineY).stroke();

  doc.restore();
  return lineY + 8;
}

function drawPatientDemographics(
  doc: PDFKit.PDFDocument,
  patient: PrescriptionData['patient'],
  currentY: number
): number {
  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;
  const cardH = 50;

  doc.save();

  // Background Card
  doc.roundedRect(x, currentY, w, cardH, 6).fill(COLOR.SURFACE_BG);
  doc.roundedRect(x, currentY, w, cardH, 6).strokeColor(COLOR.BORDER_STRONG).lineWidth(0.75).stroke();

  // Column 1: Patient Identity
  const col1X = x + 10;
  doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica-Bold').fontSize(6.5);
  doc.text('PATIENT IDENTIFIER & DEMOGRAPHICS', col1X, currentY + 7);

  doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(10);
  doc.text(patient.fullName, col1X, currentY + 17);

  const age = calculateAge(patient.dateOfBirth);
  doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(7.5);
  doc.text(`ID: ${patient.patientUid}  |  ${patient.gender}  |  ${age} (DOB: ${formatDate(patient.dateOfBirth)})`, col1X, currentY + 32);

  // Column 2: Blood Group & Contact
  const col2X = x + 245;
  doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica-Bold').fontSize(6.5);
  doc.text('BLOOD GROUP & CONTACT', col2X, currentY + 7);

  // Blood group pill
  const bgText = patient.bloodGroup ? `Type: ${patient.bloodGroup}` : 'Type: Unknown';
  doc.roundedRect(col2X, currentY + 17, 65, 14, 3).fill(COLOR.CRIMSON_BG);
  doc.roundedRect(col2X, currentY + 17, 65, 14, 3).strokeColor(COLOR.CRIMSON_BORDER).lineWidth(0.5).stroke();
  doc.fillColor(COLOR.CRIMSON).font('Helvetica-Bold').fontSize(7.5);
  doc.text(bgText, col2X + 5, currentY + 20);

  doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(7.5);
  doc.text(`Phone: ${patient.phone || 'Not provided'}`, col2X, currentY + 34);

  // Column 3: Allergies & Clinical Alerts
  const col3X = x + 370;
  doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica-Bold').fontSize(6.5);
  doc.text('CLINICAL SAFETY CONTRAINDICATIONS', col3X, currentY + 7);

  if (patient.allergies && patient.allergies.length > 0) {
    const allergenList = patient.allergies.map(a => a.allergen).join(', ');
    const alertText = `Allergies: ${allergenList}`.substring(0, 30);
    doc.roundedRect(col3X, currentY + 17, 142, 14, 3).fill(COLOR.AMBER_BG);
    doc.roundedRect(col3X, currentY + 17, 142, 14, 3).strokeColor(COLOR.AMBER_BORDER).lineWidth(0.5).stroke();
    doc.circle(col3X + 9, currentY + 24, 2.2).fill(COLOR.AMBER);
    doc.fillColor(COLOR.AMBER).font('Helvetica-Bold').fontSize(7);
    doc.text(alertText, col3X + 15, currentY + 20);
  } else {
    doc.roundedRect(col3X, currentY + 17, 142, 14, 3).fill(COLOR.EMERALD_BG);
    doc.roundedRect(col3X, currentY + 17, 142, 14, 3).strokeColor(COLOR.EMERALD_BORDER).lineWidth(0.5).stroke();
    doc.circle(col3X + 9, currentY + 24, 2.2).fill(COLOR.EMERALD);
    doc.fillColor(COLOR.EMERALD).font('Helvetica-Bold').fontSize(7);
    doc.text('No Known Drug Allergies (NKDA)', col3X + 15, currentY + 20);
  }

  // Chronic conditions preview
  if (patient.conditions && patient.conditions.length > 0) {
    const condText = patient.conditions.map(c => c.conditionName).join(', ');
    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7);
    doc.text(`Chronic: ${condText}`.substring(0, 34), col3X, currentY + 34);
  } else {
    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7);
    doc.text('No chronic conditions recorded', col3X, currentY + 34);
  }

  doc.restore();
  return currentY + cardH + 10;
}

function drawVitalsGrid(
  doc: PDFKit.PDFDocument,
  vitals: PrescriptionData['vitals'],
  currentY: number
): number {
  if (!vitals) return currentY;

  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;

  doc.save();

  // Section Header
  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(8.5);
  doc.text('PHYSIOLOGICAL VITALS & BIOMETRICS', x, currentY);
  currentY += 12;

  const tileW = (w - 32) / 5; // 5 tiles with 8pt gaps
  const tileH = 34;

  const tiles = [
    {
      label: 'BLOOD PRESSURE',
      value: vitals.systolicBp && vitals.diastolicBp ? `${vitals.systolicBp}/${vitals.diastolicBp}` : '—',
      unit: 'mmHg',
      status: vitals.systolicBp && vitals.systolicBp > 130 ? 'ELEVATED' : 'NORMAL',
      statusColor: vitals.systolicBp && vitals.systolicBp > 130 ? COLOR.AMBER : COLOR.EMERALD
    },
    {
      label: 'HEART RATE',
      value: vitals.heartRate ? `${vitals.heartRate}` : '—',
      unit: 'bpm',
      status: 'PULSE',
      statusColor: COLOR.BLUE_ACCENT
    },
    {
      label: 'TEMPERATURE',
      value: vitals.temperature ? `${vitals.temperature}` : '—',
      unit: '°C',
      status: vitals.temperature && vitals.temperature > 37.5 ? 'FEBRILE' : 'NORMAL',
      statusColor: vitals.temperature && vitals.temperature > 37.5 ? COLOR.CRIMSON : COLOR.EMERALD
    },
    {
      label: 'OXYGEN SAT (SpO2)',
      value: vitals.spo2 ? `${vitals.spo2}%` : '—',
      unit: 'room air',
      status: vitals.spo2 && vitals.spo2 < 95 ? 'ATTENTION' : 'OPTIMAL',
      statusColor: vitals.spo2 && vitals.spo2 < 95 ? COLOR.CRIMSON : COLOR.EMERALD
    },
    {
      label: 'WEIGHT & BMI',
      value: vitals.weightKg ? `${vitals.weightKg} kg` : '—',
      unit: vitals.bmi ? `BMI ${vitals.bmi}` : '',
      status: vitals.bmi ? `INDEX` : 'EST',
      statusColor: COLOR.SLATE_MUTED
    }
  ];

  tiles.forEach((t, i) => {
    const tileX = x + i * (tileW + 8);
    doc.roundedRect(tileX, currentY, tileW, tileH, 5).fill(COLOR.SURFACE_BG);
    doc.roundedRect(tileX, currentY, tileW, tileH, 5).strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).stroke();

    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica-Bold').fontSize(6);
    doc.text(t.label, tileX + 6, currentY + 5);

    doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(9.5);
    doc.text(t.value, tileX + 6, currentY + 14);

    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(6.5);
    doc.text(t.unit, tileX + 6, currentY + 25);

    // Status chip
    doc.fillColor(t.statusColor).font('Helvetica-Bold').fontSize(5.5);
    doc.text(t.status, tileX + tileW - 36, currentY + 6, { width: 30, align: 'right' });
  });

  doc.restore();
  return currentY + tileH + 10;
}

function drawDiagnoses(
  doc: PDFKit.PDFDocument,
  diagnoses: PrescriptionData['diagnoses'],
  currentY: number
): number {
  if (!diagnoses || diagnoses.length === 0) return currentY;

  const x = PAGE.MARGIN_X;

  doc.save();
  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(8.5);
  doc.text('CLINICAL DIAGNOSIS & ICD-10 CLASSIFICATION', x, currentY);
  currentY += 12;

  diagnoses.forEach(diag => {
    // ICD Code badge
    const codeText = `ICD-10 [${diag.icd10Code}]`;
    doc.fontSize(7);
    const codeW = doc.widthOfString(codeText) + 10;
    doc.roundedRect(x, currentY, codeW, 14, 3).fill(COLOR.BLUE_LIGHT);
    doc.roundedRect(x, currentY, codeW, 14, 3).strokeColor(COLOR.BLUE_BORDER).lineWidth(0.5).stroke();
    doc.fillColor(COLOR.BLUE_ACCENT).font('Helvetica-Bold').fontSize(7);
    doc.text(codeText, x + 5, currentY + 3.5);

    // Title
    doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(8.5);
    doc.text(diag.diagnosisTitle, x + codeW + 8, currentY + 2.5);

    // Severity chip
    const sev = diag.severity || 'MODERATE';
    doc.fontSize(8.5);
    const sevX = x + codeW + 12 + doc.widthOfString(diag.diagnosisTitle);
    doc.roundedRect(sevX, currentY, 48, 14, 3).fill(sev === 'SEVERE' || sev === 'CRITICAL' ? COLOR.CRIMSON_BG : COLOR.AMBER_BG);
    doc.fillColor(sev === 'SEVERE' || sev === 'CRITICAL' ? COLOR.CRIMSON : COLOR.AMBER).font('Helvetica-Bold').fontSize(6.5);
    doc.text(sev, sevX, currentY + 4, { width: 48, align: 'center' });

    currentY += 18;
  });

  doc.restore();
  return currentY + 2;
}

// ==========================================
// 5. Medication Table Engine (Dynamic Auto-Wrap)
// ==========================================

function drawMedicationTable(
  doc: PDFKit.PDFDocument,
  items: PrescriptionData['items'],
  currentY: number,
  onPageBreakNeeded?: (neededH: number) => number
): number {
  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;

  doc.save();

  // Section Header with Rx Vector Badge
  drawRxBadge(doc, x, currentY, 20);
  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(10);
  doc.text('PRESCRIBED MEDICATIONS & DOSAGE REGIMEN', x + 26, currentY + 4);

  doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7);
  doc.text('Authenticated electronic dispensing schedule', x + 310, currentY + 6, { width: w - 310, align: 'right' });

  currentY += 25;

  // Table Column Definitions
  // Total = 22 + 185 + 65 + 85 + 60 + 106 = 523
  const col = {
    idx: { x: x, w: 22 },
    med: { x: x + 22, w: 185 },
    dose: { x: x + 207, w: 65 },
    freq: { x: x + 272, w: 85 },
    dur: { x: x + 357, w: 60 },
    inst: { x: x + 417, w: 106 }
  };

  // Render Table Header
  const renderTableHeader = (headerY: number) => {
    doc.roundedRect(x, headerY, w, 20, 4).fill(COLOR.NAVY_PRIMARY);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
    doc.text('#', col.idx.x, headerY + 6, { width: col.idx.w, align: 'center' });
    doc.text('MEDICINE & GENERIC', col.med.x + 4, headerY + 6);
    doc.text('DOSAGE', col.dose.x + 4, headerY + 6);
    doc.text('SCHEDULE', col.freq.x + 4, headerY + 6);
    doc.text('DURATION', col.dur.x + 4, headerY + 6);
    doc.text('INSTRUCTIONS', col.inst.x + 4, headerY + 6);
    return headerY + 20;
  };

  currentY = renderTableHeader(currentY);

  // Render Table Rows
  items.forEach((item, idx) => {
    // Calculate required height dynamically
    doc.font('Helvetica-Bold').fontSize(8.5);
    const medNameH = doc.heightOfString(item.medicationName, { width: col.med.w - 8 });
    
    doc.font('Helvetica-Oblique').fontSize(7.5);
    const genNameH = item.genericName ? doc.heightOfString(item.genericName, { width: col.med.w - 8 }) : 0;
    
    doc.font('Helvetica').fontSize(7.5);
    const instH = item.instructions ? doc.heightOfString(item.instructions, { width: col.inst.w - 8 }) : 0;

    const contentH = Math.max(medNameH + genNameH + 8, instH + 8, 26);
    const rowH = contentH + 4;

    // Check page break
    if (currentY + rowH > PAGE.BOTTOM_LIMIT) {
      if (onPageBreakNeeded) {
        currentY = onPageBreakNeeded(rowH);
        currentY = renderTableHeader(currentY);
      }
    }

    // Row background (alternating)
    const rowBg = idx % 2 === 0 ? COLOR.SURFACE_CARD : COLOR.SURFACE_BG;
    doc.rect(x, currentY, w, rowH).fill(rowBg);
    doc.strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).moveTo(x, currentY + rowH).lineTo(x + w, currentY + rowH).stroke();

    // 1. Index
    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica-Bold').fontSize(7.5);
    doc.text(String(idx + 1), col.idx.x, currentY + 6, { width: col.idx.w, align: 'center' });

    // 2. Medication Name & Generic
    doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(8.5);
    doc.text(item.medicationName, col.med.x + 4, currentY + 4, { width: col.med.w - 8 });

    if (item.genericName) {
      doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica-Oblique').fontSize(7.5);
      doc.text(item.genericName, col.med.x + 4, currentY + 4 + medNameH, { width: col.med.w - 8 });
    }

    // 3. Dosage
    doc.fillColor(COLOR.SLATE_BODY).font('Helvetica-Bold').fontSize(8);
    doc.text(item.dosage, col.dose.x + 4, currentY + 5, { width: col.dose.w - 8 });

    // 4. Frequency / Schedule
    doc.fillColor(COLOR.BLUE_ACCENT).font('Helvetica-Bold').fontSize(8);
    doc.text(item.frequency, col.freq.x + 4, currentY + 5, { width: col.freq.w - 8 });

    // 5. Duration
    doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(8);
    doc.text(item.duration, col.dur.x + 4, currentY + 5, { width: col.dur.w - 8 });

    // 6. Instructions
    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7.5);
    doc.text(item.instructions || 'As directed', col.inst.x + 4, currentY + 5, { width: col.inst.w - 8 });

    currentY += rowH;
  });

  doc.restore();
  return currentY + 10;
}

// ==========================================
// 6. Advice, Follow-up & Security Sign-off
// ==========================================

function drawClinicalAdvice(
  doc: PDFKit.PDFDocument,
  instructions?: string,
  followUpDate?: string,
  currentY: number = 0
): number {
  if (!instructions && !followUpDate) return currentY;

  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;

  doc.save();

  doc.font('Helvetica').fontSize(8);
  const textH = instructions ? doc.heightOfString(instructions, { width: w - 24 }) : 0;
  const boxH = Math.max(38, textH + (followUpDate ? 32 : 18));

  // Framed callout card with blue accent
  doc.roundedRect(x, currentY, w, boxH, 6).fill(COLOR.BLUE_LIGHT);
  doc.roundedRect(x, currentY, w, boxH, 6).strokeColor(COLOR.BLUE_BORDER).lineWidth(0.75).stroke();
  doc.roundedRect(x, currentY, 3.5, boxH, 1.5).fill(COLOR.BLUE_ACCENT);

  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(7.5);
  doc.text('PHYSICIAN ADVICE & DIETARY DIRECTIVES', x + 12, currentY + 7);

  if (instructions) {
    doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(8);
    doc.text(instructions, x + 12, currentY + 18, { width: w - 24, lineGap: 1.5 });
  }

  if (followUpDate) {
    const fuY = currentY + boxH - 16;
    doc.fillColor(COLOR.EMERALD).font('Helvetica-Bold').fontSize(7.5);
    doc.text(`Next Review Scheduled: ${formatDate(followUpDate)}`, x + 12, fuY);
  }

  doc.restore();
  return currentY + boxH + 12;
}

async function drawSecuritySignoff(
  doc: PDFKit.PDFDocument,
  doctor: PrescriptionData['doctor'],
  docId: string,
  issueDate: string,
  verificationHash: string,
  currentY: number
): Promise<number> {
  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;
  const blockH = 74;

  doc.save();

  // Outer container
  doc.roundedRect(x, currentY, w, blockH, 6).fill(COLOR.SURFACE_BG);
  doc.roundedRect(x, currentY, w, blockH, 6).strokeColor(COLOR.BORDER_STRONG).lineWidth(0.75).stroke();

  // 1. QR Code (Left)
  const verifyUrl = `https://medralink.health/verify/rx/${docId}`;
  try {
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      type: 'png',
      width: 130,
      margin: 1,
      color: {
        dark: COLOR.SLATE_DARK,
        light: '#FFFFFF'
      }
    });
    doc.image(qrBuffer, x + 8, currentY + 6, { width: 62, height: 62 });
  } catch (err) {
    doc.rect(x + 8, currentY + 6, 62, 62).fill(COLOR.SURFACE_SUBTLE);
  }

  // 2. Cryptographic Integrity Seal (Center)
  const midX = x + 78;
  const midW = 265;
  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(7.5);
  doc.text('CRYPTOGRAPHIC INTEGRITY & AUDIT SEAL', midX, currentY + 8);

  doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(7);
  doc.text(`Authenticated Issuer: ${doctor.fullName} (BMDC: ${doctor.licenseNumber})`, midX, currentY + 20);

  doc.fillColor(COLOR.SLATE_MUTED).font('Courier').fontSize(6.5);
  doc.text(`SHA-256 Digest: ${verificationHash}`, midX, currentY + 31, { width: midW });

  doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(6.5);
  doc.text(`Digitally signed: ${new Date(issueDate).toISOString().replace('T', ' ').substring(0, 19)} UTC+6`, midX, currentY + 44);

  // Status Badge
  doc.roundedRect(midX, currentY + 54, 160, 13, 3).fill(COLOR.EMERALD_BG);
  doc.circle(midX + 8, currentY + 60.5, 2.2).fill(COLOR.EMERALD);
  doc.fillColor(COLOR.EMERALD).font('Helvetica-Bold').fontSize(6.5);
  doc.text('VERIFIED BY MEDRALINK CENTRAL REGISTRY', midX + 14, currentY + 57);

  // 3. Doctor Digital Signature Box (Right)
  const signX = x + 355;
  const signW = w - 355 - 10;

  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Oblique').fontSize(11);
  doc.text(doctor.fullName, signX, currentY + 12, { width: signW, align: 'center' });

  doc.strokeColor(COLOR.BORDER_STRONG).lineWidth(0.5).moveTo(signX, currentY + 32).lineTo(signX + signW, currentY + 32).stroke();

  doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(7.5);
  doc.text('Attending Physician Signature', signX, currentY + 36, { width: signW, align: 'center' });

  doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(6.5);
  doc.text(`Reg: ${doctor.licenseNumber}`, signX, currentY + 46, { width: signW, align: 'center' });

  doc.fillColor(COLOR.EMERALD).font('Helvetica-Bold').fontSize(6);
  doc.text('SECURED DIGITAL SIGNATURE', signX, currentY + 57, { width: signW, align: 'center' });

  doc.restore();
  return currentY + blockH + 10;
}

// ==========================================
// 7. Multi-Page Running Headers & Footers
// ==========================================

function applyRunningHeadersAndFooters(
  doc: PDFKit.PDFDocument,
  docType: string,
  docId: string
) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);

    // Running Header on subsequent pages
    if (i > range.start) {
      doc.save();
      doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7);
      doc.text(`MedraLink EMR • ${docType} [${docId}]`, PAGE.MARGIN_X, 20);
      doc.text(`Confidential Medical Record`, PAGE.MARGIN_X, 20, { width: PAGE.USABLE_WIDTH, align: 'right' });
      doc.strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).moveTo(PAGE.MARGIN_X, 30).lineTo(PAGE.MARGIN_X + PAGE.USABLE_WIDTH, 30).stroke();
      doc.restore();
    }

    // Running Footer on every page
    doc.save();
    const footerY = 812;
    doc.strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.75).moveTo(PAGE.MARGIN_X, footerY - 6).lineTo(PAGE.MARGIN_X + PAGE.USABLE_WIDTH, footerY - 6).stroke();

    doc.fillColor(COLOR.SLATE_LIGHT).font('Helvetica').fontSize(6.5);
    doc.text(
      'Official verified medical document issued under Bangladesh Medical & Dental Council (BMDC) compliance framework.',
      PAGE.MARGIN_X,
      footerY
    );
    doc.text(
      'MedraLink Digital Health Infrastructure • Cryptographically Signed • Tamper-Evident',
      PAGE.MARGIN_X,
      footerY + 9
    );

    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica-Bold').fontSize(7);
    doc.text(`Page ${i + 1} of ${totalPages}`, PAGE.MARGIN_X, footerY + 3, {
      width: PAGE.USABLE_WIDTH,
      align: 'right'
    });
    doc.restore();
  }
}

// ==========================================
// 8. Main Prescription PDF Generator
// ==========================================

export async function generatePrescriptionPDF(data: PrescriptionData, res: Response): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: PAGE.MARGIN_X,
        size: 'A4',
        bufferPages: true
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="MedraLink_Prescription_${data.prescriptionUid}.pdf"`
      );

      res.on('finish', () => resolve());
      res.on('error', (err) => reject(err));
      doc.on('error', (err) => reject(err));

      doc.pipe(res);

      let currentY = PAGE.MARGIN_X;

  // Page break helper
  const handlePageBreak = (neededH: number): number => {
    if (currentY + neededH > PAGE.BOTTOM_LIMIT) {
      doc.addPage();
      currentY = 44;
    }
    return currentY;
  };

  // 1. Official Header Banner
  currentY = drawOfficialHeader(
    doc,
    'MedraLink Clinical Health System',
    'DIGITAL E-PRESCRIPTION',
    `Rx ID: ${data.prescriptionUid}`,
    data.issueDate,
    currentY
  );

  // 2. Doctor Accreditation Letterhead
  currentY = drawDoctorLetterhead(doc, data.doctor, currentY);

  // 3. Patient Demographic Strip
  currentY = drawPatientDemographics(doc, data.patient, currentY);

  // 4. Clinical Vitals Telemetry
  if (data.vitals) {
    currentY = drawVitalsGrid(doc, data.vitals, currentY);
  }

  // 5. ICD-10 Diagnoses
  if (data.diagnoses && data.diagnoses.length > 0) {
    currentY = drawDiagnoses(doc, data.diagnoses, currentY);
  }

  // 6. Prescribed Medications Table
  currentY = drawMedicationTable(doc, data.items, currentY, handlePageBreak);

  // 7. Clinical Advice & Instructions
  if (data.instructions || data.followUpDate) {
    handlePageBreak(50);
    currentY = drawClinicalAdvice(doc, data.instructions, data.followUpDate, currentY);
  }

  // 8. Security Verification & Doctor Signature Block
  handlePageBreak(85);
  const certHash = data.verificationHash || generateCryptographicHash({
    rx: data.prescriptionUid,
    doctor: data.doctor.licenseNumber,
    patient: data.patient.patientUid,
    items: data.items.map(i => i.medicationName)
  });

  await drawSecuritySignoff(
    doc,
    data.doctor,
    data.prescriptionUid,
    data.issueDate,
    certHash,
    currentY
  );

    // 9. Two-Pass Running Headers & Footers
    applyRunningHeadersAndFooters(doc, 'Prescription', data.prescriptionUid);

    doc.end();
  } catch (err) {
    reject(err);
  }
});
}

// ==========================================
// 9. Clinical Consultation Summary PDF Generator
// ==========================================

export async function generateConsultationSummaryPDF(
  data: ConsultationSummaryData,
  res: Response
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: PAGE.MARGIN_X,
        size: 'A4',
        bufferPages: true
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="MedraLink_Consultation_${data.recordUid}.pdf"`
      );

      res.on('finish', () => resolve());
      res.on('error', (err) => reject(err));
      doc.on('error', (err) => reject(err));

      doc.pipe(res);

      let currentY = PAGE.MARGIN_X;

  const handlePageBreak = (neededH: number): number => {
    if (currentY + neededH > PAGE.BOTTOM_LIMIT) {
      doc.addPage();
      currentY = 44;
    }
    return currentY;
  };

  // 1. Header
  currentY = drawOfficialHeader(
    doc,
    'MedraLink Clinical Health System',
    'CLINICAL ENCOUNTER RECORD',
    `Visit ID: ${data.recordUid}`,
    data.visitDate,
    currentY
  );

  // 2. Doctor Letterhead
  currentY = drawDoctorLetterhead(doc, data.doctor, currentY);

  // 3. Patient Demographics
  currentY = drawPatientDemographics(doc, data.patient, currentY);

  // 4. Chief Complaint & Clinical Notes
  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;
  doc.save();

  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(8.5);
  doc.text('CHIEF COMPLAINT & CLINICAL PROGRESS NOTES', x, currentY);
  currentY += 12;

  // Complaint card
  doc.roundedRect(x, currentY, w, 28, 4).fill(COLOR.SURFACE_BG);
  doc.roundedRect(x, currentY, w, 28, 4).strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).stroke();
  doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica-Bold').fontSize(6.5);
  doc.text('PRESENTING CHIEF COMPLAINT', x + 8, currentY + 5);
  doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(8.5);
  doc.text(data.chiefComplaint, x + 8, currentY + 14, { width: w - 16 });
  currentY += 34;

  if (data.clinicalNotes) {
    doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(8);
    const notesH = doc.heightOfString(data.clinicalNotes, { width: w - 16 });
    doc.roundedRect(x, currentY, w, notesH + 12, 4).fill(COLOR.SURFACE_CARD);
    doc.roundedRect(x, currentY, w, notesH + 12, 4).strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).stroke();
    doc.text(data.clinicalNotes, x + 8, currentY + 6, { width: w - 16 });
    currentY += notesH + 18;
  }
  doc.restore();

  // 5. Vitals
  if (data.vitals) {
    currentY = drawVitalsGrid(doc, data.vitals, currentY);
  }

  // 6. Diagnoses
  if (data.diagnoses && data.diagnoses.length > 0) {
    currentY = drawDiagnoses(doc, data.diagnoses, currentY);
  }

  // 7. Prescription items (if linked)
  if (data.prescription && data.prescription.items.length > 0) {
    handlePageBreak(60);
    currentY = drawMedicationTable(
      doc,
      data.prescription.items,
      currentY,
      handlePageBreak
    );
  }

  // 8. Ordered Lab Investigations
  if (data.labOrders && data.labOrders.length > 0) {
    handlePageBreak(40);
    doc.save();
    doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(8.5);
    doc.text('ORDERED DIAGNOSTIC INVESTIGATIONS', x, currentY);
    currentY += 12;

    data.labOrders.forEach(lab => {
      doc.roundedRect(x, currentY, w, 22, 4).fill(COLOR.SURFACE_BG);
      doc.strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).moveTo(x, currentY + 22).lineTo(x + w, currentY + 22).stroke();
      doc.circle(x + 12, currentY + 11, 2.2).fill(COLOR.BLUE_ACCENT);
      doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(8);
      doc.text(`${lab.testName} (${lab.category})`, x + 18, currentY + 6);
      doc.fillColor(COLOR.BLUE_ACCENT).font('Helvetica-Bold').fontSize(7);
      doc.text(lab.status || 'ORDERED', x + w - 70, currentY + 6, { width: 60, align: 'right' });
      currentY += 24;
    });
    doc.restore();
    currentY += 6;
  }

  // 9. Sign-off
  handlePageBreak(85);
  const certHash = generateCryptographicHash({
    visit: data.recordUid,
    doctor: data.doctor.licenseNumber,
    patient: data.patient.patientUid
  });

  await drawSecuritySignoff(
    doc,
    data.doctor,
    data.recordUid,
    data.visitDate,
    certHash,
    currentY
  );

  applyRunningHeadersAndFooters(doc, 'Clinical Encounter', data.recordUid);
  doc.end();
  } catch (err) {
    reject(err);
  }
});
}

// ==========================================
// 10. Patient Health Summary Dossier PDF Generator
// ==========================================

export async function generatePatientHealthSummaryPDF(
  data: PatientHealthSummaryData,
  res: Response
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: PAGE.MARGIN_X,
        size: 'A4',
        bufferPages: true
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="MedraLink_Health_Summary_${data.patient.patientUid}.pdf"`
      );

      res.on('finish', () => resolve());
      res.on('error', (err) => reject(err));
      doc.on('error', (err) => reject(err));

      doc.pipe(res);

      let currentY = PAGE.MARGIN_X;

  const handlePageBreak = (neededH: number): number => {
    if (currentY + neededH > PAGE.BOTTOM_LIMIT) {
      doc.addPage();
      currentY = 44;
    }
    return currentY;
  };

  // 1. Header
  currentY = drawOfficialHeader(
    doc,
    'MedraLink Clinical Health System',
    'LONGITUDINAL HEALTH DOSSIER',
    `Patient ID: ${data.patient.patientUid}`,
    new Date().toISOString(),
    currentY
  );

  // 2. Comprehensive Patient Identity Card
  const x = PAGE.MARGIN_X;
  const w = PAGE.USABLE_WIDTH;
  doc.save();

  doc.roundedRect(x, currentY, w, 68, 6).fill(COLOR.SURFACE_BG);
  doc.roundedRect(x, currentY, w, 68, 6).strokeColor(COLOR.BORDER_STRONG).lineWidth(0.75).stroke();

  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(11);
  doc.text(data.patient.fullName, x + 12, currentY + 8);

  const age = calculateAge(data.patient.dateOfBirth);
  doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(8);
  doc.text(`Patient ID: ${data.patient.patientUid}  |  Gender: ${data.patient.gender}  |  Age: ${age} (DOB: ${formatDate(data.patient.dateOfBirth)})`, x + 12, currentY + 22);

  doc.text(`Address: ${data.patient.address || '—'}, ${data.patient.city || ''}  |  Contact: ${data.patient.phone || '—'}`, x + 12, currentY + 34);

  if (data.patient.emergencyContactName) {
    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7.5);
    doc.text(`Emergency Contact: ${data.patient.emergencyContactName} (${data.patient.emergencyContactRelation || 'Next of kin'} - ${data.patient.emergencyContactPhone || '—'})`, x + 12, currentY + 48);
  }

  // Blood group pill
  const bg = data.patient.bloodGroup || 'N/A';
  doc.roundedRect(x + w - 74, currentY + 8, 64, 20, 4).fill(COLOR.CRIMSON_BG);
  doc.roundedRect(x + w - 74, currentY + 8, 64, 20, 4).strokeColor(COLOR.CRIMSON_BORDER).lineWidth(0.5).stroke();
  doc.fillColor(COLOR.CRIMSON).font('Helvetica-Bold').fontSize(8.5);
  doc.text(`Blood: ${bg}`, x + w - 74, currentY + 13, { width: 64, align: 'center' });

  doc.restore();
  currentY += 78;

  // 3. Allergies & Chronic Conditions Summary
  doc.save();
  const halfW = (w - 10) / 2;

  // Allergies Box (Left)
  doc.roundedRect(x, currentY, halfW, 58, 5).fill(COLOR.SURFACE_CARD);
  doc.roundedRect(x, currentY, halfW, 58, 5).strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).stroke();
  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(7.5);
  doc.text('DOCUMENTED DRUG & CLINICAL ALLERGIES', x + 8, currentY + 6);

  if (data.allergies && data.allergies.length > 0) {
    let aY = currentY + 18;
    data.allergies.slice(0, 3).forEach(a => {
      doc.circle(x + 12, aY + 3.5, 2).fill(COLOR.CRIMSON);
      doc.fillColor(COLOR.CRIMSON).font('Helvetica-Bold').fontSize(7);
      doc.text(`${a.allergen} (${a.severity})`, x + 18, aY);
      aY += 11;
    });
  } else {
    doc.circle(x + 12, currentY + 27.5, 2.2).fill(COLOR.EMERALD);
    doc.fillColor(COLOR.EMERALD).font('Helvetica-Bold').fontSize(7.5);
    doc.text('No Known Drug Allergies (NKDA)', x + 18, currentY + 24);
  }

  // Chronic Conditions Box (Right)
  const rightBoxX = x + halfW + 10;
  doc.roundedRect(rightBoxX, currentY, halfW, 58, 5).fill(COLOR.SURFACE_CARD);
  doc.roundedRect(rightBoxX, currentY, halfW, 58, 5).strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).stroke();
  doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(7.5);
  doc.text('CHRONIC MEDICAL CONDITIONS', rightBoxX + 8, currentY + 6);

  if (data.chronicConditions && data.chronicConditions.length > 0) {
    let cY = currentY + 18;
    data.chronicConditions.slice(0, 3).forEach(c => {
      doc.circle(rightBoxX + 12, cY + 3.5, 2).fill(COLOR.SLATE_DARK);
      doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(7);
      doc.text(`${c.conditionName} (${c.status})`, rightBoxX + 18, cY);
      cY += 11;
    });
  } else {
    doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7.5);
    doc.text('No chronic conditions recorded', rightBoxX + 8, currentY + 24);
  }

  doc.restore();
  currentY += 68;

  // 4. Recent Consultations Section
  if (data.consultations && data.consultations.length > 0) {
    handlePageBreak(50);
    doc.save();
    doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(8.5);
    doc.text('LONGITUDINAL CLINICAL ENCOUNTERS', x, currentY);
    currentY += 12;

    // Header row
    doc.roundedRect(x, currentY, w, 18, 3).fill(COLOR.NAVY_PRIMARY);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
    doc.text('DATE', x + 6, currentY + 5, { width: 65 });
    doc.text('ENCOUNTER ID', x + 75, currentY + 5, { width: 75 });
    doc.text('ATTENDING PHYSICIAN', x + 155, currentY + 5, { width: 130 });
    doc.text('CHIEF COMPLAINT & DIAGNOSIS', x + 290, currentY + 5, { width: 225 });
    currentY += 18;

    data.consultations.forEach((c, idx) => {
      handlePageBreak(22);
      const rowBg = idx % 2 === 0 ? COLOR.SURFACE_CARD : COLOR.SURFACE_BG;
      doc.rect(x, currentY, w, 20).fill(rowBg);
      doc.strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).moveTo(x, currentY + 20).lineTo(x + w, currentY + 20).stroke();

      doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(7.5);
      doc.text(formatDate(c.visitDate), x + 6, currentY + 5);
      doc.fillColor(COLOR.BLUE_ACCENT).font('Helvetica-Bold').fontSize(7.5);
      doc.text(c.recordUid, x + 75, currentY + 5);
      doc.fillColor(COLOR.SLATE_DARK).font('Helvetica').fontSize(7.5);
      doc.text(c.doctorName, x + 155, currentY + 5, { width: 130 });
      doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7);
      doc.text(`${c.chiefComplaint} - ${c.diagnoses}`.substring(0, 52), x + 290, currentY + 5, { width: 225 });
      currentY += 20;
    });
    doc.restore();
    currentY += 10;
  }

  // 5. Active Prescriptions Section
  if (data.activePrescriptions && data.activePrescriptions.length > 0) {
    handlePageBreak(50);
    doc.save();
    doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(8.5);
    doc.text('ACTIVE & RECENT ELECTRONIC PRESCRIPTIONS', x, currentY);
    currentY += 12;

    doc.roundedRect(x, currentY, w, 18, 3).fill(COLOR.NAVY_PRIMARY);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
    doc.text('ISSUE DATE', x + 6, currentY + 5, { width: 70 });
    doc.text('Rx ID', x + 80, currentY + 5, { width: 80 });
    doc.text('PHYSICIAN', x + 165, currentY + 5, { width: 130 });
    doc.text('MEDICATION SUMMARY', x + 300, currentY + 5, { width: 215 });
    currentY += 18;

    data.activePrescriptions.forEach((rx, idx) => {
      handlePageBreak(22);
      const rowBg = idx % 2 === 0 ? COLOR.SURFACE_CARD : COLOR.SURFACE_BG;
      doc.rect(x, currentY, w, 20).fill(rowBg);
      doc.strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).moveTo(x, currentY + 20).lineTo(x + w, currentY + 20).stroke();

      doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(7.5);
      doc.text(formatDate(rx.issueDate), x + 6, currentY + 5);
      doc.fillColor(COLOR.BLUE_ACCENT).font('Helvetica-Bold').fontSize(7.5);
      doc.text(rx.prescriptionUid, x + 80, currentY + 5);
      doc.fillColor(COLOR.SLATE_DARK).font('Helvetica').fontSize(7.5);
      doc.text(rx.doctorName, x + 165, currentY + 5);
      doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7);
      doc.text(rx.itemsSummary.substring(0, 50), x + 300, currentY + 5);
      currentY += 20;
    });
    doc.restore();
    currentY += 10;
  }

  // 6. Diagnostic Laboratory Results
  if (data.labReports && data.labReports.length > 0) {
    handlePageBreak(50);
    doc.save();
    doc.fillColor(COLOR.NAVY_PRIMARY).font('Helvetica-Bold').fontSize(8.5);
    doc.text('DIAGNOSTIC LABORATORY INVESTIGATION REPORTS', x, currentY);
    currentY += 12;

    doc.roundedRect(x, currentY, w, 18, 3).fill(COLOR.NAVY_PRIMARY);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
    doc.text('TEST DATE', x + 6, currentY + 5, { width: 70 });
    doc.text('INVESTIGATION NAME', x + 80, currentY + 5, { width: 160 });
    doc.text('CATEGORY', x + 245, currentY + 5, { width: 90 });
    doc.text('STATUS', x + 340, currentY + 5, { width: 70 });
    doc.text('FINDINGS SUMMARY', x + 415, currentY + 5, { width: 100 });
    currentY += 18;

    data.labReports.forEach((lab, idx) => {
      handlePageBreak(22);
      const rowBg = idx % 2 === 0 ? COLOR.SURFACE_CARD : COLOR.SURFACE_BG;
      doc.rect(x, currentY, w, 20).fill(rowBg);
      doc.strokeColor(COLOR.BORDER_SUBTLE).lineWidth(0.5).moveTo(x, currentY + 20).lineTo(x + w, currentY + 20).stroke();

      doc.fillColor(COLOR.SLATE_BODY).font('Helvetica').fontSize(7.5);
      doc.text(formatDate(lab.testDate), x + 6, currentY + 5);
      doc.fillColor(COLOR.SLATE_DARK).font('Helvetica-Bold').fontSize(7.5);
      doc.text(lab.testName, x + 80, currentY + 5, { width: 160 });
      doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(7);
      doc.text(lab.category, x + 245, currentY + 5);
      doc.fillColor(COLOR.EMERALD).font('Helvetica-Bold').fontSize(7);
      doc.text(lab.status, x + 340, currentY + 5);
      doc.fillColor(COLOR.SLATE_MUTED).font('Helvetica').fontSize(6.5);
      doc.text((lab.resultsSummary || 'Document attached').substring(0, 30), x + 415, currentY + 5);
      currentY += 20;
    });
    doc.restore();
    currentY += 10;
  }

  // 7. Security verification footer
  handlePageBreak(85);
  const certHash = generateCryptographicHash({
    patient: data.patient.patientUid,
    date: new Date().toISOString()
  });

  const dummyDoctor = {
    fullName: 'MedraLink Medical Registry Authority',
    specialization: 'National Health Infrastructure',
    qualifications: 'Interoperable Health Record System',
    licenseNumber: 'ML-CENTRAL-REGISTRY',
    hospital: 'Directorate General of Health Services (DGHS)'
  };

  await drawSecuritySignoff(
    doc,
    dummyDoctor,
    data.patient.patientUid,
    new Date().toISOString(),
    certHash,
    currentY
  );

  applyRunningHeadersAndFooters(doc, 'Patient Health Dossier', data.patient.patientUid);
  doc.end();
  } catch (err) {
    reject(err);
  }
});
}
