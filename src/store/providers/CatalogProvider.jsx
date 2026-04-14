import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/features/catalog/services/categoryService';
import { getCatalogData } from '@/features/catalog/services/catalogService';
import { getApiErrorMessage } from '@/api/apiUtils';
import {
  CATALOG_SYNC_EVENT,
  CATALOG_SYNC_KEY,
  getCatalogSyncVersion,
} from '@/store/catalog/catalogSyncStore';
import { CatalogContext } from '@/store/contexts/catalogContext';
import logger from '@/shared/lib/logger';

export function CatalogProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestCatalogVersionRef = useRef(getCatalogSyncVersion());

  const refreshCatalog = useCallback(async (options = {}) => {
    const { force = false, silent = false } = options;

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const catalogData = await getCatalogData({ force });

      setCategories(Array.isArray(catalogData.categories) ? catalogData.categories : []);
      setSubcategories(Array.isArray(catalogData.subcategories) ? catalogData.subcategories : []);
      setBrands(Array.isArray(catalogData.brands) ? catalogData.brands : []);
      setSubcategoriesByCategory(catalogData.subcategoriesByCategory || {});

      return catalogData;
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, 'Failed to fetch catalog data');
      logger.error('CatalogProvider: Failed to fetch catalog:', errorMsg, err);
      setError(errorMsg);
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    const syncCatalogIfNeeded = (nextVersion) => {
      const resolvedVersion = nextVersion || getCatalogSyncVersion();
      if (!resolvedVersion || resolvedVersion === latestCatalogVersionRef.current) {
        return;
      }

      latestCatalogVersionRef.current = resolvedVersion;
      refreshCatalog({ force: true, silent: true });
    };

    const handleStorage = (event) => {
      if (event.key !== CATALOG_SYNC_KEY) {
        return;
      }
      syncCatalogIfNeeded(event.newValue);
    };

    const handleCatalogSync = (event) => syncCatalogIfNeeded(event.detail);
    const handleWindowFocus = () => syncCatalogIfNeeded();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCatalogIfNeeded();
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
  }, [refreshCatalog]);

  const value = useMemo(
    () => ({
      categories,
      subcategories,
      subcategoriesByCategory,
      brands,
      loading,
      error,
      refreshCatalog,
      addCategory: async (data) => {
        const result = await createCategory(data);
        await refreshCatalog({ force: true, silent: true });
        return result;
      },
      updateCategory: async (id, data) => {
        const result = await updateCategory(id, data);
        await refreshCatalog({ force: true, silent: true });
        return result;
      },
      deleteCategory: async (id) => {
        const result = await deleteCategory(id);
        await refreshCatalog({ force: true, silent: true });
        return result;
      },
    }),
    [brands, categories, error, loading, refreshCatalog, subcategories, subcategoriesByCategory],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
