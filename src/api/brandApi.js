import api, { publicApi } from './axiosInstance';
import { normalizeBrands } from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

const BRAND_CACHE_TTL_MS = 5 * 60 * 1000;

let brandsCache = {
  data: null,
  timestamp: 0,
  promise: null,
};

const isBrandsCacheFresh = () =>
  Array.isArray(brandsCache.data) && Date.now() - brandsCache.timestamp < BRAND_CACHE_TTL_MS;

const updateBrandsCache = (data) => {
  brandsCache = {
    data,
    timestamp: Date.now(),
    promise: null,
  };

  return data;
};

export const getBrands = async (options = {}) => {
  if (!options.force && isBrandsCacheFresh()) {
    return brandsCache.data;
  }

  if (!options.force && brandsCache.promise) {
    return brandsCache.promise;
  }

  const request = publicApi
    .get(API_ENDPOINTS.products.brands)
    .then((response) => {
      const data = normalizeBrands(response);
      return updateBrandsCache(data);
    })
    .finally(() => {
      brandsCache.promise = null;
    });

  brandsCache.promise = request;
  return request;
};

export const createBrand = async (data) => {
  const response = await api.post(API_ENDPOINTS.products.brands, data);
  brandsCache = { data: null, timestamp: 0, promise: null };
  return response.data;
};

export const getBrandById = async (id) => {
  const response = await publicApi.get(API_ENDPOINTS.products.brand(id));
  return response.data;
};

export const updateBrand = async (id, data) => {
  const response = await api.put(API_ENDPOINTS.products.brand(id), data);
  brandsCache = { data: null, timestamp: 0, promise: null };
  return response.data;
};

export const deleteBrand = async (id) => {
  const response = await api.delete(API_ENDPOINTS.products.brand(id));
  brandsCache = { data: null, timestamp: 0, promise: null };
  return response.data;
};
