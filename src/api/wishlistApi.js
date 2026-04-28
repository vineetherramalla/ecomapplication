import api from './axiosInstance';
import { extractList, unwrapResponse } from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

const getProductId = (item) => {
  if (item === null || item === undefined || item === '') {
    return null;
  }

  if (typeof item === 'object') {
    return item.product?.id ?? item.product_id ?? item.product ?? item.id ?? item.pk ?? null;
  }

  return item;
};

export const normalizeWishlistPayload = (payload) => {
  const data = unwrapResponse(payload);
  const source =
    data?.product_id ??
    data?.product_ids ??
    data?.products ??
    data?.items ??
    data?.wishlist ??
    data;
  
  if (source === null || source === undefined) {
    return [];
  }

  const items = Array.isArray(source) ? source : [source];

  return items
    .map(getProductId)
    .filter((id) => id !== null && id !== undefined && id !== '')
    .map((id) => String(id));
};

export const getWishlist = async () =>
  normalizeWishlistPayload(await api.get(API_ENDPOINTS.wishlist.wishlist));

export const setWishlist = async (productIds = []) => {
  const ids = Array.from(new Set(productIds.map((id) => Number(id) || id)));
  // Try sending as product_id (singular) which the backend expects.
  // If sending multiple, we use the plural key just in case the backend supports it too.
  const payload = ids.length === 1 ? { product_id: ids[0] } : { product_ids: ids };

  return normalizeWishlistPayload(
    await api.post(API_ENDPOINTS.wishlist.wishlist, payload),
  );
};

export const addWishlistItem = async (productId) =>
  normalizeWishlistPayload(
    await api.post(API_ENDPOINTS.wishlist.wishlist, {
      product_id: Number(productId) || productId,
    }),
  );

export const removeWishlistItem = async (productId) => {
  try {
    // Try DELETE first as it is standard for removal
    return normalizeWishlistPayload(
      await api.delete(API_ENDPOINTS.wishlist.wishlist, {
        data: { product_id: Number(productId) || productId },
      }),
    );
  } catch {
    // Fallback to POST if DELETE is not supported (some legacy APIs use POST for everything)
    return normalizeWishlistPayload(
      await api.post(API_ENDPOINTS.wishlist.wishlist, {
        product_id: Number(productId) || productId,
        remove: true,
      }),
    );
  }
};

export const wishlistApi = {
  getWishlist,
  setWishlist,
  addWishlistItem,
  removeWishlistItem,
};

export default wishlistApi;
