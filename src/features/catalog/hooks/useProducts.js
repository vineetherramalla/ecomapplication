import { useContext } from 'react';
import { ProductContext } from '@/store/contexts/productContext';

/**
 * Returns the current product context value.
 * Returns null when called outside of a ProductProvider (e.g. in admin or auth layouts).
 * Components should destructure with safe defaults: const { products = [] } = useProducts() ?? {};
 */
export const useProducts = () => {
  return useContext(ProductContext);
};
