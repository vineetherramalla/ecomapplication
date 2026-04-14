import api, { publicApi } from './axiosInstance';
import { normalizeCategories, normalizeCategory, unwrapResponse } from './apiUtils';

export const getCategories = async () => normalizeCategories(await publicApi.get('/categories/'));

export const getCategoryById = async (id) =>
  normalizeCategory(unwrapResponse(await publicApi.get(`/categories/${id}/`)));

export const createCategory = async (data) => normalizeCategory(unwrapResponse(await api.post('/categories/', data)));

export const updateCategory = async (id, data) => normalizeCategory(unwrapResponse(await api.put(`/categories/${id}/`, data)));

export const deleteCategory = (id) => api.delete(`/categories/${id}/`);
