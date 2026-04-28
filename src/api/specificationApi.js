import api, { publicApi } from './axiosInstance';
import { unwrapResponse } from './apiUtils';
import { fetchAllPages } from './requestHelpers';
import { API_ENDPOINTS } from './endpoints';

export const getSpecifications = async (params = {}) =>
  fetchAllPages(publicApi, API_ENDPOINTS.products.specifications, params);

export const getSpecificationsByProductId = async (productId) => {
  if (!productId) {
    return [];
  }

  return getSpecifications({ product: productId });
};

export const getSpecificationById = async (id) =>
  unwrapResponse(await publicApi.get(API_ENDPOINTS.products.specification(id)));

export const createSpecification = async (payload) =>
  unwrapResponse(await api.post(API_ENDPOINTS.products.specifications, payload));

export const updateSpecification = async (id, payload) =>
  unwrapResponse(await api.put(API_ENDPOINTS.products.specification(id), payload));

export const deleteSpecification = async (id) =>
  unwrapResponse(await api.delete(API_ENDPOINTS.products.specification(id)));

export const getSpecCategories = async () =>
  unwrapResponse(await publicApi.get(API_ENDPOINTS.products.specifications));
