import api, { publicApi } from './axiosInstance';
import { unwrapResponse } from './apiUtils';
import { fetchAllPages } from './requestHelpers';

export const getSpecifications = async (params = {}) =>
  fetchAllPages(publicApi, '/specifications/', params);

export const getSpecificationsByProductId = async (productId) => {
  if (!productId) {
    return [];
  }

  return getSpecifications({ product: productId });
};

export const getSpecificationById = async (id) =>
  unwrapResponse(await publicApi.get(`/specifications/${id}/`));

export const createSpecification = async (payload) =>
  unwrapResponse(await api.post('/specifications/', payload));

export const updateSpecification = async (id, payload) =>
  unwrapResponse(await api.put(`/specifications/${id}/`, payload));

export const deleteSpecification = async (id) =>
  unwrapResponse(await api.delete(`/specifications/${id}/`));

export const getSpecCategories = async () =>
  unwrapResponse(await publicApi.get('/spec-categories/'));
