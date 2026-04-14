import { useContext } from 'react';
import { CatalogContext } from '@/store/contexts/catalogContext';

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
