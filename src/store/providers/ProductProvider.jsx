import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '@/api/productApi';
import { getApiErrorMessage } from '@/api/apiUtils';
import {
  CATALOG_SYNC_EVENT,
  CATALOG_SYNC_KEY,
  getCatalogSyncVersion,
} from '@/store/catalog/catalogSyncStore';
import { CatalogContext } from '@/store/contexts/catalogContext';
import { ProductContext } from '@/store/contexts/productContext';
import logger from '@/utils/logger';

const mergeProductIntoList = (currentProducts, nextProduct) => {
  const nextId = String(nextProduct?.id || '');
  const currentIndex = currentProducts.findIndex((product) => String(product.id) === nextId);

  if (currentIndex === -1) {
    return [...currentProducts, nextProduct];
  }

  return currentProducts.map((product, index) => (index === currentIndex ? nextProduct : product));
};

export function ProductProvider({ children }) {
  const catalog = useContext(CatalogContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const latestProductVersionRef = useRef(getCatalogSyncVersion());
  const activeRequestRef = useRef(null);
  const hasFetchedInitialProductsRef = useRef(false);
  const isMountedRef = useRef(true);

  const {
    categories = [],
    subcategories = [],
    subcategoriesByCategory = {},
    brands = [],
    loading: catalogLoading,
  } = catalog || {};

  const catalogSnapshotRef = useRef({ categories, subcategories, brands });
  
  useEffect(() => {
    catalogSnapshotRef.current = { categories, subcategories, brands };
  }, [categories, subcategories, brands]);

  const refreshProducts = useCallback(async (options = {}) => {
    const { silent = false, force = false } = options;

    if (activeRequestRef.current && !force) {
      return activeRequestRef.current;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    const request = (async () => {
      try {
        const productRes = await getProducts({
          categories: catalogSnapshotRef.current.categories,
          subcategories: catalogSnapshotRef.current.subcategories,
          brands: catalogSnapshotRef.current.brands,
        });
        
        if (!isMountedRef.current) return productRes;

        setProducts(Array.isArray(productRes) ? productRes : []);
        return productRes;
      } catch (err) {
        if (!isMountedRef.current) return null;

        if (err?.response?.status === 429) {
          console.warn("Too many requests. Please wait.");
        }
        
        const errorMsg = getApiErrorMessage(err, 'Failed to fetch products');
        logger.error('ProductContext: Failed to fetch products:', errorMsg, err);
        setError(errorMsg);
        return null;
      } finally {
        if (activeRequestRef.current === request) {
          activeRequestRef.current = null;
        }
        if (!silent && isMountedRef.current) {
          setLoading(false);
        }
      }
    })();

    activeRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    if (catalogLoading || hasFetchedInitialProductsRef.current) {
      return;
    }
    
    hasFetchedInitialProductsRef.current = true;
    refreshProducts();
  }, [catalogLoading, refreshProducts]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const syncProductsIfNeeded = (nextVersion) => {
      const resolvedVersion = nextVersion || getCatalogSyncVersion();
      if (!resolvedVersion || resolvedVersion === latestProductVersionRef.current) {
        return;
      }

      latestProductVersionRef.current = resolvedVersion;
      refreshProducts({ silent: true });
    };

    const handleStorage = (event) => {
      if (event.key !== CATALOG_SYNC_KEY) {
        return;
      }
      syncProductsIfNeeded(event.newValue);
    };

    const handleCatalogSync = (event) => syncProductsIfNeeded(event.detail);
    const handleWindowFocus = () => syncProductsIfNeeded();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncProductsIfNeeded();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CATALOG_SYNC_EVENT, handleCatalogSync);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CATALOG_SYNC_EVENT, handleCatalogSync);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshProducts]);

  const topSellingProducts = useMemo(
    () => products.filter((product) => product.topSelling).slice(0, 8),
    [products],
  );

  const featuredProducts = useMemo(
    () => products.filter((product) => product.featured),
    [products],
  );

  const value = useMemo(
    () => ({
      products,
      loading: loading || catalogLoading,
      error,
      topSellingProducts,
      featuredProducts,
      refreshProducts,
      addProduct: async (data) => {
        const result = await createProduct(data, { categories, subcategories, brands });
        setProducts((current) => mergeProductIntoList(current, result));
        return result;
      },
      updateProduct: async (id, data) => {
        const result = await updateProduct(id, data, { categories, subcategories, brands });
        setProducts((current) => mergeProductIntoList(current, result));
        return result;
      },
      deleteProduct: async (id) => {
        const result = await deleteProduct(id);
        setProducts((current) => current.filter((product) => String(product.id) !== String(id)));
        return result;
      },
      categories,
      subcategories,
      subcategoriesByCategory,
      brands,
    }),
    [
      brands,
      categories,
      catalogLoading,
      error,
      featuredProducts,
      loading,
      products,
      refreshProducts,
      subcategories,
      subcategoriesByCategory,
      topSellingProducts,
    ],
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}