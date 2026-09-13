import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { PatientDashboard } from './pages/PatientDashboard.js';
import { PatientTimelinePage } from './pages/PatientTimelinePage.js';
import { DoctorDashboard } from './pages/DoctorDashboard.js';
import { NewConsultationPage } from './pages/NewConsultationPage.js';
import { PrescriptionViewPage } from './pages/PrescriptionViewPage.js';
import { AdminDashboard } from './pages/AdminDashboard.js';

const HomeRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Shared Prescription View */}
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
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
