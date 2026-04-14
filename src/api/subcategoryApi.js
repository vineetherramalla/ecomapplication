import api, { publicApi } from './axiosInstance';
import {
  normalizeSubcategories,
  normalizeSubcategory,
  unwrapResponse,
} from './apiUtils';

const withParentCategory = (data = {}, categoryId = null) => {
  const payload = { ...data };
  const resolvedParentId =
    payload.parent ??
    payload.parent_id ??
    payload.category_id ??
    payload.categoryId ??
    categoryId;

  if (resolvedParentId && payload.parent === undefined && payload.parent_id === undefined) {
    payload.parent = resolvedParentId;
  }

  delete payload.category_id;
  delete payload.categoryId;

  return payload;
};

export const getSubcategories = async (categoryId) => {
  if (!categoryId) {
    return [];
  }

  return normalizeSubcategories(await publicApi.get(`/categories/${categoryId}/subcategories/`), categoryId);
};

export const getSubcategoryById = async (categoryId, id) =>
  normalizeSubcategory(
    unwrapResponse(await publicApi.get(`/categories/${id}/`)),
    categoryId,
  );

export const createSubcategory = async (categoryId, data) =>
  normalizeSubcategory(
    unwrapResponse(await api.post(`/categories/${categoryId}/subcategories/`, data)),
    categoryId,
  );

export const updateSubcategory = async (categoryId, id, data) =>
  normalizeSubcategory(
    unwrapResponse(await api.put(`/categories/${id}/`, withParentCategory(data, categoryId))),
    categoryId,
  );

export const deleteSubcategory = async (categoryId, id) =>
  unwrapResponse(await api.delete(`/categories/${id}/`));
