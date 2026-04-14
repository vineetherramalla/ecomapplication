import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import authService from '@/features/auth/services/authService';
import PageLoader from '@/shared/components/feedback/PageLoader';

const AdminLayout = lazy(() => import('@/features/admin/layout/AdminLayout'));
const AdminCategoriesPage = lazy(() => import('@/features/admin/pages/AdminCategoriesPage'));
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const AdminInventoryPage = lazy(() => import('@/features/admin/pages/AdminInventoryPage'));
const AdminLoginPage = lazy(() => import('@/features/admin/pages/AdminLoginPage'));
const AdminProductsPage = lazy(() => import('@/features/admin/pages/AdminProductsPage'));
const AdminRFQPage = lazy(() => import('@/features/admin/pages/AdminRFQPage'));
const AdminSubcategoriesPage = lazy(() => import('@/features/admin/pages/AdminSubcategoriesPage'));

function AdminEntry() {
  if (!authService.isAuthenticated()) {
    return <AdminLoginPage />;
  }

  if (authService.isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function AdminGuard() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  if (!authService.isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminLayout />;
}

function AdminRoutes() {
  return (
    <Suspense fallback={<PageLoader message="Loading admin workspace..." minHeight="40vh" compact />}>
      <Routes>
        <Route path="/" element={<AdminEntry />} />
        <Route element={<AdminGuard />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="subcategories" element={<AdminSubcategoriesPage />} />
          <Route path="rfq" element={<AdminRFQPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AdminRoutes;
