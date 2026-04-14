import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import PageLoader from '@/shared/components/feedback/PageLoader';

const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const Home = lazy(() => import('@/pages/store/Home'));
const Products = lazy(() => import('@/pages/store/Products'));
const ProductDetails = lazy(() => import('@/pages/store/ProductDetails'));
const NotFound = lazy(() => import('@/pages/store/NotFound'));
const Contact = lazy(() => import('@/pages/store/Contact'));

function StoreShell() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function StoreRoutes() {
  return (
    <Suspense fallback={<PageLoader message="Loading storefront..." />}>
      <Routes>
        <Route element={<StoreShell />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:category" element={<Products />} />
          <Route path="products/:category/:subcategory" element={<Products />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default StoreRoutes;
