import type { Suggestion } from './suggest.js';

/** Divisions, district towns and busy Dhaka and Chattogram areas; the hint carries the Bangla name. */
const place = (value: string, hint: string): Suggestion => ({ value, hint });

export const PLACES: readonly Suggestion[] = [
  // Dhaka city areas
  place('Dhanmondi, Dhaka', 'ধানমন্ডি'), place('Gulshan, Dhaka', 'গুলশান'), place('Banani, Dhaka', 'বনানী'),
  place('Uttara, Dhaka', 'উত্তরা'), place('Mirpur, Dhaka', 'মিরপুর'), place('Mohammadpur, Dhaka', 'মোহাম্মদপুর'),
  place('Motijheel, Dhaka', 'মতিঝিল'), place('Shahbagh, Dhaka', 'শাহবাগ'), place('Farmgate, Dhaka', 'ফার্মগেট'),
  place('Panthapath, Dhaka', 'পান্থপথ'), place('Badda, Dhaka', 'বাড্ডা'), place('Bashundhara, Dhaka', 'বসুন্ধরা'),
  place('Malibagh, Dhaka', 'মালিবাগ'), place('Shyamoli, Dhaka', 'শ্যামলী'), place('Jatrabari, Dhaka', 'যাত্রাবাড়ী'),
  place('Old Dhaka', 'পুরান ঢাকা'), place('Tejgaon, Dhaka', 'তেজগাঁও'), place('Khilgaon, Dhaka', 'খিলগাঁও'),
  // Chattogram areas
  place('Agrabad, Chattogram', 'আগ্রাবাদ'), place('GEC Circle, Chattogram', 'জিইসি মোড়'), place('Panchlaish, Chattogram', 'পাঁচলাইশ'),
  place('Halishahar, Chattogram', 'হালিশহর'),
  // Division and district towns
  place('Dhaka', 'ঢাকা'), place('Chattogram', 'চট্টগ্রাম'), place('Sylhet', 'সিলেট'), place('Rajshahi', 'রাজশাহী'),
  place('Khulna', 'খুলনা'), place('Barishal', 'বরিশাল'), place('Rangpur', 'রংপুর'), place('Mymensingh', 'ময়মনসিংহ'),
  place('Gazipur', 'গাজীপুর'), place('Narayanganj', 'নারায়ণগঞ্জ'), place('Savar', 'সাভার'), place('Cumilla', 'কুমিল্লা'),
  place("Cox's Bazar", 'কক্সবাজার'), place('Feni', 'ফেনী'), place('Noakhali', 'নোয়াখালী'), place('Brahmanbaria', 'ব্রাহ্মণবাড়িয়া'),
  place('Bogura', 'বগুড়া'), place('Pabna', 'পাবনা'), place('Dinajpur', 'দিনাজপুর'), place('Jashore', 'যশোর'),
  place('Kushtia', 'কুষ্টিয়া'), place('Faridpur', 'ফরিদপুর'), place('Tangail', 'টাঙ্গাইল'), place('Jamalpur', 'জামালপুর'),
  place('Moulvibazar', 'মৌলভীবাজার'), place('Habiganj', 'হবিগঞ্জ'), place('Sunamganj', 'সুনামগঞ্জ'), place('Patuakhali', 'পটুয়াখালী'),
  place('Bhola', 'ভোলা'), place('Satkhira', 'সাতক্ষীরা'), place('Bagerhat', 'বাগেরহাট'), place('Rangamati', 'রাঙ্গামাটি'),
  place('Bandarban', 'বান্দরবান'), place('Kishoreganj', 'কিশোরগঞ্জ'), place('Netrokona', 'নেত্রকোনা'), place('Sirajganj', 'সিরাজগঞ্জ'),
  place('Naogaon', 'নওগাঁ'), place('Chapainawabganj', 'চাঁপাইনবাবগঞ্জ'), place('Thakurgaon', 'ঠাকুরগাঁও'), place('Kurigram', 'কুড়িগ্রাম'),
];
