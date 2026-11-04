/** Common ICD-10 (WHO) diagnoses in Bangladesh outpatient practice, for the consultation picker. */
export interface Icd10Entry {
  code: string;
  title: string;
}

const entry = (code: string, title: string): Icd10Entry => ({ code, title });

export const ICD10_CODES: readonly Icd10Entry[] = [
  // Infections
  entry('A01.0', 'Typhoid Fever'),
  entry('A09', 'Infectious Gastroenteritis and Colitis'),
  entry('A15', 'Respiratory Tuberculosis'),
  entry('A90', 'Dengue Fever'),
  entry('A91', 'Dengue Haemorrhagic Fever'),
  entry('B01', 'Varicella (Chickenpox)'),
  entry('B18.1', 'Chronic Viral Hepatitis B'),
  entry('B34.9', 'Viral Infection, Unspecified'),
  entry('B35', 'Dermatophytosis (Tinea)'),
  entry('B54', 'Malaria, Unspecified'),
  entry('B86', 'Scabies'),
  entry('U07.1', 'COVID-19, Virus Identified'),
  // Blood and endocrine
  entry('D50', 'Iron Deficiency Anaemia'),
  entry('D64.9', 'Anaemia, Unspecified'),
  entry('E03.9', 'Hypothyroidism, Unspecified'),
  entry('E05', 'Thyrotoxicosis (Hyperthyroidism)'),
  entry('E10', 'Type 1 Diabetes Mellitus'),
  entry('E11', 'Type 2 Diabetes Mellitus'),
  entry('E28.2', 'Polycystic Ovary Syndrome'),
  entry('E55.9', 'Vitamin D Deficiency'),
  entry('E66', 'Obesity'),
  entry('E78', 'Hyperlipidemia'),
  entry('E86', 'Dehydration (Volume Depletion)'),
  // Mental health and nervous system
  entry('F32', 'Depressive Episode'),
  entry('F41', 'Anxiety Disorder'),
  entry('G40', 'Epilepsy'),
  entry('G43', 'Migraine'),
  entry('G47.0', 'Insomnia'),
  // Eye and ear
  entry('H10', 'Conjunctivitis'),
  entry('H66', 'Otitis Media'),
  // Circulatory
  entry('I10', 'Essential (Primary) Hypertension'),
  entry('I20', 'Angina Pectoris'),
  entry('I21', 'Acute Myocardial Infarction'),
  entry('I25', 'Chronic Ischaemic Heart Disease'),
  entry('I48', 'Atrial Fibrillation'),
  entry('I50', 'Heart Failure'),
  entry('I63', 'Cerebral Infarction (Ischaemic Stroke)'),
  entry('I83', 'Varicose Veins of Lower Limbs'),
  // Respiratory
  entry('J01', 'Acute Sinusitis'),
  entry('J02', 'Acute Pharyngitis'),
  entry('J03', 'Acute Tonsillitis'),
  entry('J06', 'Acute Upper Respiratory Infection'),
  entry('J18', 'Pneumonia, Unspecified Organism'),
  entry('J20', 'Acute Bronchitis'),
  entry('J30.4', 'Allergic Rhinitis'),
  entry('J44', 'Chronic Obstructive Pulmonary Disease'),
  entry('J45', 'Asthma'),
  // Digestive
  entry('K21', 'Gastro-oesophageal Reflux Disease'),
  entry('K27', 'Peptic Ulcer'),
  entry('K29', 'Gastritis'),
  entry('K30', 'Functional Dyspepsia'),
  entry('K58', 'Irritable Bowel Syndrome'),
  entry('K59.0', 'Constipation'),
  entry('K64', 'Haemorrhoids'),
  entry('K76.0', 'Fatty Liver Disease'),
  entry('K80', 'Cholelithiasis (Gallstones)'),
  // Skin
  entry('L30.9', 'Dermatitis, Unspecified'),
  entry('L70', 'Acne'),
  // Musculoskeletal
  entry('M06', 'Rheumatoid Arthritis'),
  entry('M10', 'Gout'),
  entry('M17', 'Osteoarthritis of Knee'),
  entry('M54.2', 'Cervicalgia (Neck Pain)'),
  entry('M54.5', 'Low Back Pain'),
  entry('M81', 'Osteoporosis'),
  // Kidney, urinary and reproductive
  entry('N18', 'Chronic Kidney Disease'),
  entry('N20.0', 'Kidney Stone'),
  entry('N39.0', 'Urinary Tract Infection'),
  entry('N40', 'Benign Prostatic Hyperplasia'),
  entry('N94.6', 'Dysmenorrhoea'),
  entry('Z34', 'Supervision of Normal Pregnancy'),
  // Symptoms
  entry('R05', 'Cough'),
  entry('R07.4', 'Chest Pain, Unspecified'),
  entry('R10.4', 'Abdominal Pain'),
  entry('R11', 'Nausea and Vomiting'),
  entry('R17', 'Jaundice'),
  entry('R42', 'Dizziness and Vertigo'),
  entry('R50.9', 'Fever, Unspecified'),
  entry('R51', 'Headache'),
];

const byCode = (code: string) => ICD10_CODES.find((c) => c.code === code) as Icd10Entry;

/** Shown as one-tap chips; the rest are reached through search. */
export const QUICK_ICD10: readonly Icd10Entry[] = ['I10', 'E11', 'J06', 'A90', 'K29', 'R50.9', 'N39.0', 'J45'].map(byCode);

const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Code-prefix matches first, then entries whose title contains every typed word. */
export const searchIcd10 = (query: string, limit = 8): Icd10Entry[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qCode = compact(q);
  const words = q.split(/\s+/);
  const codeHits = ICD10_CODES.filter((c) => compact(c.code).startsWith(qCode));
  const titleHits = ICD10_CODES.filter(
    (c) => !codeHits.includes(c) && words.every((w) => c.title.toLowerCase().includes(w)),
  );
  return [...codeHits, ...titleHits].slice(0, limit);
};
