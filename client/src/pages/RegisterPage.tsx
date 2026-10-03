import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Card, Icon, Button, FormField, Input } from '../ui/primitives.js';

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
    "w-full h-11 rounded-xl border border-hair-strong bg-white px-3.5 text-sm text-ink-900 outline-none transition-colors hover:border-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-50";

  return (
    <div className="min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8 bg-canvas flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        <div className="text-center mb-6">
          <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary-700 text-white shadow-card mb-3">
            <Icon.Cross size={24} />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            Create Medra<span className="text-primary-600">Link</span> Account
          </h1>
          <p className="text-sm text-ink-600 mt-1">Register for continuous clinical record management</p>
        </div>

        <Card className="p-6 sm:p-8">
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-primary-50/60 rounded-xl mb-6 border border-hair">
            <button
              type="button"
              onClick={() => setRole('PATIENT')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer ${
                role === 'PATIENT' ? 'bg-white text-primary-700 shadow-xs' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Icon.User size={16} className="text-success" />
              <span>Patient Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('DOCTOR')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer ${
                role === 'DOCTOR' ? 'bg-white text-primary-700 shadow-xs' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Icon.Stethoscope size={16} className="text-primary-600" />
              <span>Doctor Workstation</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
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
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors p-1"
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
              <div className="pt-2 border-t border-hair grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <div className="pt-2 border-t border-hair grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="mt-6 text-center text-xs text-ink-600 border-t border-hair pt-4">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
