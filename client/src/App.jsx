import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import AppShell from './layouts/AppShell';
import ConditionalLayout from './layouts/ConditionalLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/public/LandingPage';
import TechniciansPage from './pages/public/TechniciansPage';
import TechnicianProfilePage from './pages/public/TechnicianProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import TechnicianDashboardPage from './pages/technician/TechnicianDashboardPage';
import TechnicianProfileSettingsPage from './pages/technician/TechnicianProfileSettingsPage';
import TechnicianVerificationPage from './pages/technician/TechnicianVerificationPage';
import TechnicianReviewsPage from './pages/technician/TechnicianReviewsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import RequestsPage from './pages/requests/RequestsPage';
import RequestFormPage from './pages/requests/RequestFormPage';
import RequestDetailPage from './pages/requests/RequestDetailPage';
import JobBoardPage from './pages/technician/JobBoardPage';
import MessagesPage from './pages/messages/MessagesPage';
import AdminModulePage from './pages/admin/AdminModulePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      <Route element={<ConditionalLayout />}>
        <Route path="technicians" element={<TechniciansPage />} />
        <Route path="technicians/:id" element={<TechnicianProfilePage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />
          <Route element={<ProtectedRoute roles={['customer']} />}>
            <Route path="dashboard" element={<CustomerDashboardPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="requests/new" element={<RequestFormPage />} />
            <Route path="requests/:id/edit" element={<RequestFormPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['technician']} />}>
            <Route path="technician" element={<TechnicianDashboardPage />} />
            <Route path="technician/jobs" element={<JobBoardPage />} />
            <Route path="technician/profile" element={<TechnicianProfileSettingsPage />} />
            <Route path="technician/verification" element={<TechnicianVerificationPage />} />
            <Route path="technician/reviews" element={<TechnicianReviewsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/:section" element={<AdminModulePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}