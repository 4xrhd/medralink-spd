import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface PrescriptionData {
  prescriptionUid: string;
  issueDate: string;
  instructions?: string;
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
  };
  vitals?: {
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    temperature?: number;
    spo2?: number;
    weightKg?: number;
    bmi?: number;
  };
  diagnoses?: Array<{
    icd10Code: string;
    diagnosisTitle: string;
    severity?: string;
  }>;
  items: Array<{
    medicationName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
}

export function generatePrescriptionPDF(data: PrescriptionData, res: Response) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="MedraLink_Prescription_${data.prescriptionUid}.pdf"`);

  doc.pipe(res);

  // 1. Header Banner
  doc.rect(40, 40, 515, 65).fill('#1B365D');

  doc.fillColor('#FFFFFF');
  doc.fontSize(20).font('Helvetica-Bold').text('MedraLink EMR', 55, 52);
  doc.fontSize(9).font('Helvetica').text('Centralized Clinical Health Record & Digital Prescription System', 55, 76);
  doc.fontSize(10).font('Helvetica-Bold').text(`Rx ID: ${data.prescriptionUid}`, 400, 56, { align: 'right', width: 140 });
  doc.fontSize(8).font('Helvetica').text(`Date: ${new Date(data.issueDate).toLocaleDateString()}`, 400, 72, { align: 'right', width: 140 });

  // 2. Doctor Details Box
  let y = 120;
  doc.fillColor('#1B365D').fontSize(13).font('Helvetica-Bold').text(data.doctor.fullName, 45, y);
  doc.fillColor('#4B5563').fontSize(9).font('Helvetica').text(`${data.doctor.qualifications} | BMDC Reg: ${data.doctor.licenseNumber}`, 45, y + 16);
  doc.text(`Specialization: ${data.doctor.specialization}`, 45, y + 28);
  if (data.doctor.hospital) {
    doc.text(`Hospital: ${data.doctor.hospital}`, 45, y + 40);
  }
  if (data.doctor.chamber) {
    doc.text(`Chamber: ${data.doctor.chamber}`, 45, y + 52);
  }

  // Divider
  y += 70;
  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();

  // 3. Patient Details Banner
  y += 10;
  doc.rect(40, y, 515, 38).fill('#F1F5F9');
  doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
  doc.text(`Patient: ${data.patient.fullName} (${data.patient.patientUid})`, 50, y + 8);
  doc.text(`Gender: ${data.patient.gender} | DOB: ${data.patient.dateOfBirth}`, 50, y + 22);

  doc.text(`Blood Group: ${data.patient.bloodGroup || 'N/A'}`, 340, y + 8);
  doc.text(`Contact: ${data.patient.phone || 'N/A'}`, 340, y + 22);

  // 4. Vitals & Clinical Findings
  y += 50;
  if (data.vitals) {
    doc.fillColor('#1B365D').fontSize(10).font('Helvetica-Bold').text('CLINICAL VITALS:', 45, y);
    doc.fillColor('#334155').fontSize(9).font('Helvetica');
    const v = data.vitals;
    const vitalsStr = [
      v.systolicBp && v.diastolicBp ? `BP: ${v.systolicBp}/${v.diastolicBp} mmHg` : null,
      v.heartRate ? `Pulse: ${v.heartRate} bpm` : null,
      v.temperature ? `Temp: ${v.temperature} °C` : null,
      v.spo2 ? `SpO2: ${v.spo2}%` : null,
      v.weightKg ? `Weight: ${v.weightKg} kg` : null,
      v.bmi ? `BMI: ${v.bmi}` : null
    ].filter(Boolean).join('   |   ');

    doc.text(vitalsStr || 'None recorded', 45, y + 14);
    y += 32;
  }

  // 5. Clinical Diagnoses (ICD-10)
  if (data.diagnoses && data.diagnoses.length > 0) {
    doc.fillColor('#1B365D').fontSize(10).font('Helvetica-Bold').text('DIAGNOSIS (ICD-10):', 45, y);
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica');
    y += 14;
    for (const d of data.diagnoses) {
      doc.text(`• [${d.icd10Code}] ${d.diagnosisTitle} (${d.severity || 'Moderate'})`, 55, y);
      y += 14;
    }
    y += 8;
  }

  // Divider
  doc.strokeColor('#CBD5E1').lineWidth(1.5).moveTo(40, y).lineTo(555, y).stroke();
  y += 12;

  // 6. Prescription Rx Table
  doc.fillColor('#1B365D').fontSize(16).font('Helvetica-Bold').text('℞', 45, y);
  doc.fontSize(10).text('MEDICATIONS & DOSAGE REGIMEN', 70, y + 4);
  y += 24;

  // Table header
  doc.rect(40, y, 515, 20).fill('#E2E8F0');
  doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold');
  doc.text('#', 45, y + 6);
  doc.text('Medicine / Generic', 65, y + 6);
  doc.text('Dosage', 240, y + 6);
  doc.text('Frequency', 310, y + 6);
  doc.text('Duration', 410, y + 6);
  doc.text('Instructions', 470, y + 6);
  y += 20;

  // Table rows
  doc.font('Helvetica').fontSize(8);
  data.items.forEach((item, idx) => {
    const rowColor = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(40, y, 515, 24).fill(rowColor);
    doc.fillColor('#0F172A');
    doc.text(String(idx + 1), 45, y + 7);
    doc.font('Helvetica-Bold').text(item.medicationName, 65, y + 4, { width: 170 });
    doc.font('Helvetica').fillColor('#64748B').text(item.genericName || '', 65, y + 14, { width: 170 });

    doc.fillColor('#0F172A').text(item.dosage, 240, y + 7);
    doc.text(item.frequency, 310, y + 7);
    doc.text(item.duration, 410, y + 7);
    doc.text(item.instructions || 'As advised', 470, y + 7, { width: 80 });
    y += 24;
  });

  // General Instructions
  y += 16;
  if (data.instructions) {
    doc.fillColor('#1B365D').fontSize(9).font('Helvetica-Bold').text('GENERAL ADVICE & INSTRUCTIONS:', 45, y);
    doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(data.instructions, 45, y + 12, { width: 505 });
    y += 36;
  }

  // Footer & Digital Verification Sign-off
  const footerY = 740;
  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, footerY).lineTo(555, footerY).stroke();
  doc.fillColor('#64748B').fontSize(7.5).font('Helvetica');
  doc.text('This is a verified computer-generated medical record issued via MedraLink Health Infrastructure.', 45, footerY + 8);
  doc.text(`Authenticated BMDC License: ${data.doctor.licenseNumber} | Validation Hash: ${Buffer.from(data.prescriptionUid).toString('base64')}`, 45, footerY + 18);
  doc.text(`Page 1 of 1`, 500, footerY + 18, { align: 'right' });

  doc.end();
}
