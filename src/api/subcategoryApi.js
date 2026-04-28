import api, { publicApi } from './axiosInstance';
import {
  normalizeSubcategories,
  normalizeSubcategory,
  unwrapResponse,
} from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

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

  return normalizeSubcategories(await publicApi.get(API_ENDPOINTS.products.subcategories(categoryId)), categoryId);
};

export const getSubcategoryById = async (categoryId, id) =>
  normalizeSubcategory(
    unwrapResponse(await publicApi.get(API_ENDPOINTS.products.category(id))),
    categoryId,
  );

export const createSubcategory = async (categoryId, data) =>
  normalizeSubcategory(
    unwrapResponse(await api.post(API_ENDPOINTS.products.subcategories(categoryId), data)),
    categoryId,
  );

export const updateSubcategory = async (categoryId, id, data) =>
  normalizeSubcategory(
    unwrapResponse(await api.put(API_ENDPOINTS.products.category(id), withParentCategory(data, categoryId))),
    categoryId,
  );

export const deleteSubcategory = async (categoryId, id) =>
  unwrapResponse(await api.delete(API_ENDPOINTS.products.category(id)));
