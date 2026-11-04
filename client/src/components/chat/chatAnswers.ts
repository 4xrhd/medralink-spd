/**
 * Canned answers for the signed-out help chat. Everything runs in the browser:
 * no message leaves the page, so nobody should type health details expecting a reply.
 */
export interface ChatLink {
  to: string;
  label: string;
}

export interface ChatReply {
  text: string;
  link?: ChatLink;
}

export interface PresetQuestion extends ChatReply {
  question: string;
  answer: string;
  keywords: readonly string[];
}

const preset = (question: string, answer: string, keywords: string[], link?: ChatLink): PresetQuestion =>
  ({ question, answer, text: answer, keywords, link });

export const PRESET_QUESTIONS: readonly PresetQuestion[] = [
  preset('What is MedraLink?',
    'MedraLink keeps your prescriptions, visits and lab reports in one digital record that you and your doctors can open.',
    ['medralink', 'about', 'how does it work', 'মেড্রালিংক', 'সম্পর্কে']),
  preset('I have an emergency. What should I do?',
    'Call 999 or the national hotline 16263 right away. To find the nearest hospital, open the emergency hospital finder.',
    ['emergency', 'urgent', 'ambulance', 'chest pain', 'accident', 'জরুরি', 'অ্যাম্বুলেন্স', 'বুকে ব্যথা', 'দুর্ঘটনা'],
    { to: '/hospitals', label: 'Find an emergency hospital' }),
  preset('How do I find a hospital near me?',
    'Open the hospital finder, allow location access or type your area, and filter by specialty. No account is needed.',
    ['hospital', 'nearby', 'near me', 'clinic', 'হাসপাতাল', 'কাছের', 'ক্লিনিক'],
    { to: '/hospitals', label: 'Open the hospital finder' }),
  preset('How do I create an account?',
    'Choose Get started, pick patient or doctor, and fill in your details. Doctors also enter their BMDC registration number.',
    ['account', 'register', 'sign up', 'signup', 'join', 'অ্যাকাউন্ট', 'নিবন্ধন', 'রেজিস্টার'],
    { to: '/register', label: 'Create an account' }),
  preset('Is MedraLink free for patients?',
    'Yes. Patients can create an account, view their timeline and download prescriptions at no cost.',
    ['free', 'cost', 'price', 'pay', 'fee', 'বিনামূল্যে', 'খরচ', 'টাকা', 'ফি']),
  preset('Who can see my medical record?',
    'You, and doctors who have had a consultation with you. Other patients and doctors who have not treated you cannot open it.',
    ['who can see', 'privacy', 'private', 'secure', 'security', 'record', 'গোপনীয়তা', 'নিরাপদ', 'রেকর্ড', 'কে দেখতে']),
  preset('How can a pharmacy check a prescription?',
    'Each prescription PDF has a QR code that links to the issued prescription, so a pharmacy can compare it with the paper copy.',
    ['pharmacy', 'prescription', 'qr', 'verify', 'fake', 'ফার্মেসি', 'প্রেসক্রিপশন', 'যাচাই', 'নকল']),
  preset('I forgot my password.',
    'Choose Forgot password on the sign-in page and enter your email. You will get a link to set a new password.',
    ['password', 'forgot', 'reset', 'login', 'sign in', "can't sign", 'পাসওয়ার্ড', 'ভুলে', 'লগইন'],
    { to: '/forgot-password', label: 'Reset my password' }),
];

export const FALLBACK_ANSWER =
  'Sorry, I can only answer common questions. Pick one of the topics below, or sign in to reach your doctor.';

/** `translateText` maps an English preset to the visitor's language, so a tapped Bangla question still matches. */
export const answerFor = (input: string, translateText: (english: string) => string = (t) => t): ChatReply => {
  const text = input.trim().toLowerCase();
  if (!text) return { text: FALLBACK_ANSWER };
  const exact = PRESET_QUESTIONS.find(
    (q) => q.question.toLowerCase() === text || translateText(q.question).toLowerCase() === text,
  );
  // Order matters: emergency is listed before hospital, so "emergency hospital" gets the hotline first
  const match = exact ?? PRESET_QUESTIONS.find((q) => q.keywords.some((k) => text.includes(k)));
  return match ? { text: match.answer, link: match.link } : { text: FALLBACK_ANSWER };
};
