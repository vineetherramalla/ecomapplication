import { publicApi } from './axiosInstance';
import { extractList, normalizeProducts, unwrapResponse } from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

const normalizeAutocompleteItems = (payload) => {
  const items = extractList(payload);

  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      return item?.suggestion || item?.value || item?.label || item?.name || item?.query || '';
    })
    .map((item) => String(item).trim())
    .filter(Boolean);
};

export const searchProducts = async (params = {}, catalog = {}) => {
  const response = await publicApi.get(API_ENDPOINTS.search.search, { params });
  return normalizeProducts(response, catalog);
};

export const autocompleteSearch = async (query, params = {}) => {
  if (!String(query || '').trim()) {
    return [];
  }

  const response = await publicApi.get(API_ENDPOINTS.search.autocomplete, {
    params: {
      q: query,
      search: query,
      ...params,
    },
    suppressGlobalErrorToast: true,
  });

  return normalizeAutocompleteItems(response);
};

export const getSearchFacets = async (params = {}) => {
  const response = await publicApi.get(API_ENDPOINTS.search.facets, {
    params,
    suppressGlobalErrorToast: true,
  });
  return unwrapResponse(response) || {};
};

export const searchApi = {
  searchProducts,
  autocompleteSearch,
  getSearchFacets,
};

export default searchApi;
