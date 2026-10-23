/** Specialization filter options; `keyword` narrows the Google Places hospital search. */
export const SPECIALTIES = [
  { value: '', label: 'All hospitals', keyword: '' },
  { value: 'emergency', label: 'Emergency & Trauma', keyword: 'emergency trauma' },
  { value: 'cardiology', label: 'Cardiology (Heart)', keyword: 'cardiac heart' },
  { value: 'neurology', label: 'Neurology (Brain & Nerves)', keyword: 'neuro' },
  { value: 'pediatrics', label: 'Pediatrics (Children)', keyword: 'children pediatric' },
  { value: 'maternity', label: 'Gynecology & Maternity', keyword: 'maternity gynecology' },
  { value: 'orthopedics', label: 'Orthopedics (Bones & Joints)', keyword: 'orthopedic' },
  { value: 'oncology', label: 'Oncology (Cancer)', keyword: 'cancer' },
  { value: 'nephrology', label: 'Kidney & Dialysis', keyword: 'kidney dialysis' },
  { value: 'eye', label: 'Eye Care', keyword: 'eye' },
  { value: 'ent', label: 'ENT (Ear, Nose & Throat)', keyword: 'ENT' },
  { value: 'dental', label: 'Dental', keyword: 'dental' },
  { value: 'psychiatry', label: 'Mental Health', keyword: 'psychiatric mental health' },
  { value: 'burn', label: 'Burn Unit', keyword: 'burn' },
] as const;

export type SpecialtyValue = (typeof SPECIALTIES)[number]['value'];
