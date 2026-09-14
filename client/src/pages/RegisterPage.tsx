import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Card, Icon, Pill } from '../ui/primitives.js';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // Patient fields
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [bloodGroup, setBloodGroup] = useState('O+');
  // Doctor fields
  const [specialization, setSpecialization] = useState('Cardiology');
  const [bmdcLicense, setBmdcLicense] = useState('');
  const [qualifications, setQualifications] = useState('MBBS, FCPS');
  const [hospital, setHospital] = useState('Square Hospital / NICVD');

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload: any = {
        role,
        fullName,
        email,
        phone,
        password,
      };

      if (role === 'PATIENT') {
        payload.patientData = {
          dateOfBirth,
          gender,
          bloodGroup,
        };
      } else {
        payload.doctorData = {
          specialization,
          bmdcLicenseNumber: bmdcLicense || `BMDC-A-${Math.floor(10000 + Math.random() * 90000)}`,
          qualifications,
          hospitalAffiliation: hospital,
        };
      }

      await register(payload);
      if (role === 'DOCTOR') navigate('/doctor');
      else navigate('/patient');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#EFF6FF]";

  return (
    <div className="min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        <div className="text-center mb-6">
          <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-[#1B365D] text-white shadow-md mb-3">
            <Icon.Cross size={24} />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Create Medra<span className="text-[#2563EB]">Link</span> Account
          </h1>
          <p className="text-sm text-[#475569] mt-1">Register for continuous clinical record management</p>
        </div>

        <Card className="p-6 sm:p-8">
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F1F5F9] rounded-xl mb-6 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setRole('PATIENT')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                role === 'PATIENT' ? 'bg-white text-[#1B365D] shadow-xs' : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Icon.User size={16} className="text-[#059669]" />
              <span>Patient Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('DOCTOR')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                role === 'DOCTOR' ? 'bg-white text-[#1B365D] shadow-xs' : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Icon.Stethoscope size={16} className="text-[#2563EB]" />
              <span>Doctor Workstation</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              <Icon.Alert size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-fullname" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                  Full Name
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Sabrina Khan"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                  Phone Number
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+88017XXXXXXXX"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Fields based on Role */}
            {role === 'PATIENT' ? (
              <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="reg-dob" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                    Date of Birth
                  </label>
                  <input
                    id="reg-dob"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="reg-gender" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                    Gender
                  </label>
                  <select
                    id="reg-gender"
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    className={inputCls}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-bloodgroup" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                    Blood Group
                  </label>
                  <select
                    id="reg-bloodgroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className={inputCls}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-spec" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                    Specialization
                  </label>
                  <input
                    id="reg-spec"
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Internal Medicine"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="reg-bmdc" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                    BMDC License Number
                  </label>
                  <input
                    id="reg-bmdc"
                    type="text"
                    value={bmdcLicense}
                    onChange={(e) => setBmdcLicense(e.target.value)}
                    placeholder="e.g. A-98120"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="reg-qual" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                    Qualifications
                  </label>
                  <input
                    id="reg-qual"
                    type="text"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="e.g. MBBS, FCPS"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="reg-hosp" className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                    Hospital Affiliation
                  </label>
                  <input
                    id="reg-hosp"
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. Square Hospital"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#16294a] focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icon.Loader size={16} className="animate-spin text-white" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <>
                  <Icon.Lock size={16} />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#475569] border-t border-[#E2E8F0] pt-4">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#2563EB] hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
