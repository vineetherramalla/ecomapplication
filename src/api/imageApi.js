import api, { publicApi } from './axiosInstance';
import { unwrapResponse } from './apiUtils';
import { fetchAllPages, getMultipartConfig } from './requestHelpers';

export const getImages = async (params = {}) => fetchAllPages(publicApi, '/images/', params);

export const getImagesByProductId = async (productId) => {
  if (!productId) {
    return [];
  }

  return getImages({ product: productId });
};

export const getImageById = async (id) =>
  unwrapResponse(await publicApi.get(`/images/${id}/`));

export const createImage = async (payload) =>
  unwrapResponse(await api.post('/images/', payload, getMultipartConfig(payload)));

export const updateImage = async (id, payload) =>
  unwrapResponse(await api.put(`/images/${id}/`, payload, getMultipartConfig(payload)));

export const deleteImage = async (id) =>
  unwrapResponse(await api.delete(`/images/${id}/`));
