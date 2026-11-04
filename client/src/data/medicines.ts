import type { Suggestion } from './suggest.js';

/** Widely prescribed brands in Bangladesh; the hint gives the generic and strength. */
const med = (value: string, hint: string): Suggestion => ({ value, hint });

export const MEDICINES: readonly Suggestion[] = [
  // Pain and fever
  med('Tab. Napa', 'Paracetamol 500mg'), med('Tab. Napa Extra', 'Paracetamol + Caffeine'), med('Tab. Ace', 'Paracetamol 500mg'),
  med('Syp. Napa', 'Paracetamol 120mg/5ml'), med('Tab. Tufnil', 'Tolfenamic acid 200mg'), med('Tab. Naprosyn', 'Naproxen 500mg'),
  med('Tab. Clofenac', 'Diclofenac 50mg'),
  // Stomach
  med('Cap. Seclo', 'Omeprazole 20mg'), med('Tab. Sergel', 'Esomeprazole 20mg'), med('Tab. Pantonix', 'Pantoprazole 20mg'),
  med('Tab. Maxpro', 'Esomeprazole 20mg'), med('Tab. Antacid', 'Aluminium + Magnesium hydroxide'), med('Tab. Motigut', 'Domperidone 10mg'),
  med('Tab. Emistat', 'Ondansetron 8mg'), med('Sachet ORSaline-N', 'Oral rehydration salts'), med('Tab. Filmet', 'Metronidazole 400mg'),
  // Antibiotics
  med('Cap. Moxacil', 'Amoxicillin 500mg'), med('Tab. Fimoxyl', 'Amoxicillin 500mg'), med('Tab. Zimax', 'Azithromycin 500mg'),
  med('Tab. Azithrocin', 'Azithromycin 500mg'), med('Tab. Ciprocin', 'Ciprofloxacin 500mg'), med('Cap. Cef-3', 'Cefixime 200mg'),
  med('Tab. Cefotil', 'Cefuroxime 500mg'), med('Cap. Flubex', 'Flucloxacillin 500mg'), med('Tab. Doxicap', 'Doxycycline 100mg'),
  // Allergy and respiratory
  med('Tab. Fexo', 'Fexofenadine 120mg'), med('Tab. Alatrol', 'Cetirizine 10mg'), med('Tab. Monas', 'Montelukast 10mg'),
  med('Inh. Azmasol', 'Salbutamol 100mcg'), med('Syp. Tusca', 'Cough syrup'),
  // Heart and blood pressure
  med('Tab. Amlocard', 'Amlodipine 5mg'), med('Tab. Camlodin', 'Amlodipine 5mg'), med('Tab. Losart', 'Losartan 50mg'),
  med('Tab. Osartil', 'Losartan 50mg'), med('Tab. Bisocor', 'Bisoprolol 2.5mg'), med('Tab. Nebilol', 'Nebivolol 5mg'),
  med('Tab. Ecosprin', 'Aspirin 75mg'), med('Tab. Clopid', 'Clopidogrel 75mg'), med('Tab. Rosuva', 'Rosuvastatin 10mg'),
  med('Tab. Atova', 'Atorvastatin 10mg'), med('Tab. Lasix', 'Furosemide 40mg'),
  // Diabetes and thyroid
  med('Tab. Comet', 'Metformin 500mg'), med('Tab. Secrin', 'Glimepiride 2mg'), med('Tab. Linagliptin', 'Linagliptin 5mg'),
  med('Tab. Empa', 'Empagliflozin 10mg'), med('Inj. Insulin Mixtard', 'Human insulin 30/70'), med('Tab. Thyrox', 'Levothyroxine 50mcg'),
  // Vitamins and supplements
  med('Tab. Calbo-D', 'Calcium + Vitamin D3'), med('Cap. D-Rise', 'Vitamin D3 20000 IU'), med('Cap. Zif-CI', 'Iron + Folic acid + Zinc'),
  med('Tab. Neuro-B', 'Vitamin B1, B6, B12'),
  // Nerves and mental health
  med('Tab. Rivotril', 'Clonazepam 0.5mg'), med('Tab. Pregaba', 'Pregabalin 75mg'), med('Tab. Flunarizine', 'Flunarizine 5mg'),
  med('Tab. Stemetil', 'Prochlorperazine 5mg'),
  // Skin
  med('Oint. Betnovate', 'Betamethasone 0.1%'), med('Cream Fungidal', 'Clotrimazole 1%'), med('Lotion Scabex', 'Permethrin 5%'),
];
