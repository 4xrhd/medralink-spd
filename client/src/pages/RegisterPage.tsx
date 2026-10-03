import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Icon, Button, FormField, Input } from '../ui/primitives.js';
import { EcgLine } from '../ui/medical.js';

export const RegisterPage: React.FC = () => {
  useDocumentTitle('Account Registration');
  const toast = useToast();
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // Patient fields
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  // Doctor fields
  const [specialization, setSpecialization] = useState('');
  const [bmdcLicense, setBmdcLicense] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [hospital, setHospital] = useState('');

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
        if (!bmdcLicense.trim()) {
          setError('BMDC license number is required for doctor registration.');
          toast.error('BMDC license number is required.');
          setIsSubmitting(false);
          return;
        }
        payload.doctorData = {
          specialization,
          bmdcLicenseNumber: bmdcLicense.trim(),
          qualifications,
          hospitalAffiliation: hospital,
        };
      }

      await register(payload);
      toast.success('Account successfully registered!');
      if (role === 'DOCTOR') navigate('/doctor');
      else navigate('/patient');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please check inputs.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectCls =
    'w-full h-11 rounded-xl border border-hair-strong bg-white px-3.5 text-sm text-ink-900 outline-none transition-colors hover:border-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100';

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-canvas">
      <div className="w-full max-w-5xl rounded-3xl border border-hair bg-surface shadow-card overflow-hidden grid lg:grid-cols-12">
        {/* Left Healthcare Reassurance Panel */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-sm border border-white/20 shadow-inner">
                <Icon.Cross size={22} className="text-white" />
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight">
                  Medra<span className="text-primary-300">Link</span>
                </span>
                <p className="text-[11px] font-medium uppercase tracking-wider text-primary-200">
                  Registration Portal
                </p>
              </div>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold tracking-wider uppercase text-primary-300">
                Join the Network
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white leading-snug">
                One digital identity for continuous clinical care.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-100/90">
                Whether you are a patient building your lifelong medical record or a clinician managing your practice queue, MedraLink keeps every record safe, structured, and instantly accessible.
              </p>
            </div>

            <div className="my-8">
              <EcgLine strokeClassName="stroke-primary-400/60" className="h-10 w-full" />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-primary-300">
                  <Icon.Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Unique Health ID (HID)</p>
                  <p className="text-xs text-primary-200/80">
                    A permanent digital health identifier linked to your national clinical timeline.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-primary-300">
                  <Icon.Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Verified BMDC Practitioner Status</p>
                  <p className="text-xs text-primary-200/80">
                    Doctors undergo registration and verification before gaining prescribing privileges.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-primary-300">
                  <Icon.Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Patient-Controlled Consent</p>
                  <p className="text-xs text-primary-200/80">
                    Only authorized doctors can view your timeline during an active clinical encounter.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-primary-200/80 flex items-center justify-between">
            <span>Clinical Standards Compliant</span>
            <span className="font-mono text-[11px] text-primary-300">BMDC Guidelines</span>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="lg:hidden text-center mb-6">
            <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary-700 text-white shadow-card mb-2">
              <Icon.Cross size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
              Create Medra<span className="text-primary-600">Link</span> Account
            </h1>
            <p className="text-xs text-ink-600 mt-1">
              Register for continuous clinical record management
            </p>
          </div>

          <div className="max-w-xl w-full mx-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
                Create your clinical account
              </h1>
              <p className="text-sm text-ink-600 mt-1">
                Select your account type to begin setup.
              </p>
            </div>

            {/* Role Selector Large Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole('PATIENT')}
                className={`relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  role === 'PATIENT'
                    ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-600/20 shadow-xs'
                    : 'border-hair bg-white hover:border-primary-200 hover:bg-slate-50/60'
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    role === 'PATIENT'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-primary-50 text-primary-700'
                  }`}
                >
                  <Icon.User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-ink-900">
                      Patient Profile
                    </span>
                    {role === 'PATIENT' && (
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-primary-600 text-white">
                        <Icon.Check size={10} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-600 mt-0.5 leading-snug">
                    Personal health record, prescriptions &amp; visit history
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('DOCTOR')}
                className={`relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  role === 'DOCTOR'
                    ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-600/20 shadow-xs'
                    : 'border-hair bg-white hover:border-primary-200 hover:bg-slate-50/60'
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    role === 'DOCTOR'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-primary-50 text-primary-700'
                  }`}
                >
                  <Icon.Stethoscope size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-ink-900">
                      Doctor Portal
                    </span>
                    {role === 'DOCTOR' && (
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-primary-600 text-white">
                        <Icon.Check size={10} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-600 mt-0.5 leading-snug">
                    BMDC clinical workstation &amp; e-prescriptions
                  </p>
                </div>
              </button>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
                <Icon.Alert size={16} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full legal name" htmlFor="reg-fullname" required>
                  <Input
                    id="reg-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'DOCTOR' ? 'e.g. Dr. Sabrina Khan' : 'e.g. Rahim Ahmed'}
                    leftIcon={<Icon.User size={16} />}
                  />
                </FormField>

                <FormField label="Phone number" htmlFor="reg-phone" required>
                  <Input
                    id="reg-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+88017XXXXXXXX"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Email address" htmlFor="reg-email" required>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </FormField>

                <FormField label="Account password" htmlFor="reg-password" required>
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    leftIcon={<Icon.Lock size={16} />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-xs font-medium text-ink-400 hover:text-ink-900 transition-colors p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    }
                  />
                </FormField>
              </div>

              {/* Conditional Fields based on Role */}
              {role === 'PATIENT' ? (
                <div className="pt-3 border-t border-hair grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Date of birth" htmlFor="reg-dob" required>
                    <Input
                      id="reg-dob"
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Gender" htmlFor="reg-gender">
                    <select
                      id="reg-gender"
                      value={gender}
                      onChange={(e: any) => setGender(e.target.value)}
                      className={selectCls}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </FormField>

                  <FormField label="Blood group" htmlFor="reg-bloodgroup">
                    <select
                      id="reg-bloodgroup"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className={selectCls}
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
                  </FormField>
                </div>
              ) : (
                <div className="pt-3 border-t border-hair grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Medical specialization" htmlFor="reg-spec" required>
                    <Input
                      id="reg-spec"
                      type="text"
                      required
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Internal Medicine"
                    />
                  </FormField>

                  <FormField label="BMDC license number" htmlFor="reg-bmdc" required>
                    <Input
                      id="reg-bmdc"
                      type="text"
                      required
                      value={bmdcLicense}
                      onChange={(e) => setBmdcLicense(e.target.value)}
                      placeholder="e.g. A-98120"
                    />
                  </FormField>

                  <FormField label="Degrees & qualifications" htmlFor="reg-qual">
                    <Input
                      id="reg-qual"
                      type="text"
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                      placeholder="e.g. MBBS, FCPS"
                    />
                  </FormField>

                  <FormField label="Hospital affiliation" htmlFor="reg-hosp">
                    <Input
                      id="reg-hosp"
                      type="text"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g. Square Hospital"
                    />
                  </FormField>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                isLoading={isSubmitting}
                icon={<Icon.Lock size={16} />}
              >
                Complete Registration
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-ink-600 border-t border-hair pt-5">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
