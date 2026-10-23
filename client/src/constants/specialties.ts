/**
 * Specialization filter options for the OpenStreetMap hospital search.
 * `osm` lists `healthcare:speciality` tag values; `names` matches hospital names, because many
 * hospitals in Bangladesh are not tagged with a speciality on OpenStreetMap.
 */
export const SPECIALTIES = [
  { value: '', label: 'All hospitals', osm: [], names: null },
  { value: 'emergency', label: 'Emergency & Trauma', osm: ['emergency', 'trauma'], names: /emergency|trauma|accident/i },
  { value: 'cardiology', label: 'Cardiology (Heart)', osm: ['cardiology', 'cardiac_surgery'], names: /heart|cardi/i },
  { value: 'neurology', label: 'Neurology (Brain & Nerves)', osm: ['neurology', 'neurosurgery'], names: /neuro|brain/i },
  { value: 'pediatrics', label: 'Pediatrics (Children)', osm: ['paediatrics', 'pediatrics', 'paediatric_surgery'], names: /child|shishu|paediatric|pediatric|kids/i },
  { value: 'maternity', label: 'Gynecology & Maternity', osm: ['gynaecology', 'obstetrics', 'maternity'], names: /maternity|mother|matri|women|gyn|obstetric/i },
  { value: 'orthopedics', label: 'Orthopedics (Bones & Joints)', osm: ['orthopaedics', 'orthopedics'], names: /ortho|bone|nitor/i },
  { value: 'oncology', label: 'Oncology (Cancer)', osm: ['oncology', 'radiotherapy'], names: /cancer|oncolog|tumou?r/i },
  { value: 'nephrology', label: 'Kidney & Dialysis', osm: ['nephrology', 'urology', 'dialysis'], names: /kidney|dialysis|nephro|\burolog/i },
  { value: 'eye', label: 'Eye Care', osm: ['ophthalmology'], names: /\beye\b|chokkhu|ophthalm|vision/i },
  { value: 'ent', label: 'ENT (Ear, Nose & Throat)', osm: ['otolaryngology', 'ent'], names: /\bent\b|\bear\b|nose|throat/i },
  { value: 'dental', label: 'Dental', osm: ['dentistry', 'dental'], names: /dental|teeth/i },
  { value: 'psychiatry', label: 'Mental Health', osm: ['psychiatry'], names: /mental|psychiatr|mind/i },
  { value: 'burn', label: 'Burn Unit', osm: ['burns', 'plastic_surgery'], names: /burn|plastic/i },
] as const;

export type SpecialtyValue = (typeof SPECIALTIES)[number]['value'];
