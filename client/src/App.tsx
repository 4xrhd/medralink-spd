import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { Navbar } from './components/Navbar.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { PageLoader } from './components/PageLoader.js';

// Route-based code-splitting for optimal bundle distribution & fast first paint
const LandingPage = lazy(() =>
  import('./pages/LandingPage.js').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage }))
);
const PatientDashboard = lazy(() =>
  import('./pages/PatientDashboard.js').then((m) => ({ default: m.PatientDashboard }))
);
const PatientTimelinePage = lazy(() =>
  import('./pages/PatientTimelinePage.js').then((m) => ({ default: m.PatientTimelinePage }))
);
const DoctorDashboard = lazy(() =>
  import('./pages/DoctorDashboard.js').then((m) => ({ default: m.DoctorDashboard }))
);
const NewConsultationPage = lazy(() =>
  import('./pages/NewConsultationPage.js').then((m) => ({ default: m.NewConsultationPage }))
);
const PrescriptionViewPage = lazy(() =>
  import('./pages/PrescriptionViewPage.js').then((m) => ({ default: m.PrescriptionViewPage }))
);
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard.js').then((m) => ({ default: m.AdminDashboard }))
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            {/* Skip-to-content accessibility link */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-xl focus:bg-[#1B365D] focus:px-4 focus:py-2.5 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              Skip to main content
            </a>

            <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
              <Navbar />
              <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Enterprise Landing Page */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/landing" element={<LandingPage />} />

                    {/* Public Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Shared Official Digital Prescription Sheet */}
                    <Route path="/prescription/:id" element={<PrescriptionViewPage />} />

                    {/* Patient Role Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']} />}>
                      <Route path="/patient" element={<PatientDashboard />} />
                      <Route path="/patient/timeline/:id" element={<PatientTimelinePage />} />
                    </Route>

                    {/* Doctor Role Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} />}>
                      <Route path="/doctor" element={<DoctorDashboard />} />
                      <Route path="/doctor/new-consultation" element={<NewConsultationPage />} />
                    </Route>

                    {/* Admin Role Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/audit-logs" element={<AdminDashboard />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
