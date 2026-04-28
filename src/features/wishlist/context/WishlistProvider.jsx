import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/api/apiUtils';
import wishlistApi from '@/api/wishlistApi';
import authService from '@/features/auth/services/authService';
import { WishlistContext } from '@/store/contexts/wishlistContext';
import logger from '@/utils/logger';

const STORAGE_KEY = 'nxsys_guest_wishlist';

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const uniqueIds = (ids = []) =>
  Array.from(new Set(ids.map((id) => String(id)).filter(Boolean)));

const readGuestWishlist = () => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? uniqueIds(parsed) : [];
  } catch (error) {
    logger.warn('Unable to parse guest wishlist. Resetting local copy.', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

const writeGuestWishlist = (ids = []) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueIds(ids)));
};

const clearGuestWishlist = () => {
  if (canUseStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

export function WishlistProvider({ children }) {
  const [productIds, setProductIds] = useState(() => readGuestWishlist());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);
  const isAuthenticated = authService.isAuthenticated();

  const replaceIds = useCallback((nextIds) => {
    const normalizedIds = uniqueIds(nextIds);
    setProductIds(normalizedIds);

    if (!authService.isAuthenticated()) {
      writeGuestWishlist(normalizedIds);
    }

    return normalizedIds;
  }, []);

  const syncAuthenticatedWishlist = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      replaceIds(readGuestWishlist());
      return [];
    }

    setLoading(true);
    setError('');

    try {
      const guestIds = readGuestWishlist();
      const remoteIds = await wishlistApi.getWishlist();
      const mergedIds = uniqueIds([...remoteIds, ...guestIds]);

      if (guestIds.length && mergedIds.length !== remoteIds.length) {
        const savedIds = await wishlistApi.setWishlist(mergedIds);
        if (isMountedRef.current) {
          setProductIds(savedIds.length ? savedIds : mergedIds);
        }
        clearGuestWishlist();
        return savedIds.length ? savedIds : mergedIds;
      }

      if (isMountedRef.current) {
        setProductIds(remoteIds);
      }
      clearGuestWishlist();
      return remoteIds;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to load wishlist');
      logger.warn('Wishlist sync failed:', err);
      if (isMountedRef.current) {
        setError(message);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [replaceIds]);

  useEffect(() => {
    isMountedRef.current = true;
    syncAuthenticatedWishlist();

    return () => {
      isMountedRef.current = false;
    };
  }, [syncAuthenticatedWishlist, isAuthenticated]);

  const persistAuthenticatedIds = useCallback(async (nextIds, actionType = 'set', targetProductId = null) => {
    if (!authService.isAuthenticated()) {
      return replaceIds(nextIds);
    }

    const previousIds = productIds;
    const optimisticIds = uniqueIds(nextIds);
    setProductIds(optimisticIds);
    setError('');

    try {
      let resolvedIds = optimisticIds;
      
      if (actionType === 'add' && targetProductId) {
        await wishlistApi.addWishlistItem(targetProductId);
      } else if (actionType === 'remove' && targetProductId) {
        await wishlistApi.removeWishlistItem(targetProductId);
      } else {
        const savedIds = await wishlistApi.setWishlist(optimisticIds);
        resolvedIds = savedIds.length ? savedIds : optimisticIds;
      }

      if (isMountedRef.current) {
        setProductIds(resolvedIds);
      }
      return resolvedIds;
    } catch (err) {
      if (isMountedRef.current) {
        setProductIds(previousIds);
        setError(getApiErrorMessage(err, 'Unable to update wishlist'));
      }
      throw err;
    }
  }, [productIds, replaceIds]);

  const addToWishlist = useCallback(
    (productId) => persistAuthenticatedIds([...productIds, String(productId)], 'add', productId),
    [persistAuthenticatedIds, productIds],
  );

  const removeFromWishlist = useCallback(
    (productId) => persistAuthenticatedIds(productIds.filter((id) => id !== String(productId)), 'remove', productId),
    [persistAuthenticatedIds, productIds],
  );

  const toggleWishlist = useCallback(
    (productId) => {
      const normalizedId = String(productId);
      return productIds.includes(normalizedId)
        ? removeFromWishlist(normalizedId)
        : addToWishlist(normalizedId);
    },
    [addToWishlist, productIds, removeFromWishlist],
  );

  const value = useMemo(
    () => ({
      productIds,
      count: productIds.length,
      loading,
      error,
      isWishlisted: (productId) => productIds.includes(String(productId)),
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      refreshWishlist: syncAuthenticatedWishlist,
    }),
    [
      addToWishlist,
      error,
      loading,
      productIds,
      removeFromWishlist,
      syncAuthenticatedWishlist,
      toggleWishlist,
    ],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export default WishlistProvider;
