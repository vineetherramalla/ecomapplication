import api, { publicApi } from './axiosInstance';
import { normalizeCategories, normalizeCategory, unwrapResponse } from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

export const getCategories = async () => normalizeCategories(await publicApi.get(API_ENDPOINTS.products.categories));

export const getCategoryById = async (id) =>
  normalizeCategory(unwrapResponse(await publicApi.get(API_ENDPOINTS.products.category(id))));

export const createCategory = async (data) =>
  normalizeCategory(unwrapResponse(await api.post(API_ENDPOINTS.products.categories, data)));

export const updateCategory = async (id, data) =>
  normalizeCategory(unwrapResponse(await api.put(API_ENDPOINTS.products.category(id), data)));

export const deleteCategory = (id) => api.delete(API_ENDPOINTS.products.category(id));
