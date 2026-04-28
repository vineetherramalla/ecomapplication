import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from '@/components/common/ScrollToTop';
import ToastNotification from '@/components/common/ToastNotification';
import PageLoader from '@/components/common/feedback/PageLoader';

const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const VerifyEmailOTP = lazy(() => import('@/pages/auth/VerifyEmailOTP'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const VerifyOTP = lazy(() => import('@/pages/auth/VerifyOTP'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const AdminRoutes = lazy(() => import('@/routes/AdminRoutes'));
const StoreRoutes = lazy(() => import('@/routes/StoreRoutes'));

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader message="Loading experience..." />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/verify-email-otp" element={<VerifyEmailOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<StoreRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastNotification />
    </>
  );
}

export default AppRoutes;
