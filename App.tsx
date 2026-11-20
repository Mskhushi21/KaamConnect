import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.tsx';
import type { UserRole } from './data/constants.ts';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { FindJobsPage } from './pages/FindJobsPage.tsx';
import { JobDetailsPage } from './pages/JobDetailsPage.tsx';
import { HireWorkersPage } from './pages/HireWorkersPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { WorkerRegisterPage } from './pages/WorkerRegisterPage.tsx';
import { EmployerRegisterPage } from './pages/EmployerRegisterPage.tsx';
import { WorkerDashboardPage } from './pages/WorkerDashboardPage.tsx';
import { EmployerDashboardPage } from './pages/EmployerDashboardPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AboutPage, HelpPage, PrivacyPage, TermsPage } from './pages/InfoPages.tsx';

function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectPath =
      user.role === 'admin'
        ? '/admin/dashboard'
        : user.role === 'employer'
        ? '/employer/dashboard'
        : '/worker/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<FindJobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/hire-workers" element={<HireWorkersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/worker" element={<WorkerRegisterPage />} />
          <Route path="/register/employer" element={<EmployerRegisterPage />} />

          <Route
            path="/worker/dashboard"
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
