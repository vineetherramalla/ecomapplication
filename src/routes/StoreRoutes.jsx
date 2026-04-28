import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import PageLoader from '@/components/common/feedback/PageLoader';
import { CatalogProvider } from '@/store/providers/CatalogProvider';
import { ProductProvider } from '@/store/providers/ProductProvider';
import WishlistProvider from '@/features/wishlist/context/WishlistProvider';

const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const Home = lazy(() => import('@/pages/store/Home'));
const Products = lazy(() => import('@/pages/store/Products'));
const ProductDetails = lazy(() => import('@/pages/store/ProductDetails'));
const NotFound = lazy(() => import('@/pages/store/NotFound'));
const Contact = lazy(() => import('@/pages/store/Contact'));
const TermsConditions = lazy(() => import('@/pages/store/TermsConditions'));
const PrivacyPolicy = lazy(() => import('@/pages/store/PrivacyPolicy'));
const Wishlist = lazy(() => import('@/pages/store/Wishlist'));

function StoreShell() {
  return (
    <CatalogProvider>
      <ProductProvider>
        <WishlistProvider>
          <MainLayout>
            <Outlet />
          </MainLayout>
        </WishlistProvider>
      </ProductProvider>
    </CatalogProvider>
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
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms-conditions" element={<TermsConditions />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default StoreRoutes;
