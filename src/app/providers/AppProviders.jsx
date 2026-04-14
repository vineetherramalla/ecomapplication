import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { CatalogProvider } from '@/store/providers/CatalogProvider';
import { ProductProvider } from '@/store/providers/ProductProvider';

function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <CatalogProvider>
          <ProductProvider>{children}</ProductProvider>
        </CatalogProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default AppProviders;
