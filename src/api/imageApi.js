import api, { publicApi } from './axiosInstance';
import { unwrapResponse } from './apiUtils';
import { fetchAllPages, getMultipartConfig } from './requestHelpers';
import { API_ENDPOINTS } from './endpoints';

export const getImages = async (params = {}) => fetchAllPages(publicApi, API_ENDPOINTS.products.images, params);

export const getImagesByProductId = async (productId) => {
  if (!productId) {
    return [];
  }

  return getImages({ product: productId });
};

export const getImageById = async (id) =>
  unwrapResponse(await publicApi.get(API_ENDPOINTS.products.image(id)));

export const createImage = async (payload) =>
  unwrapResponse(await api.post(API_ENDPOINTS.products.images, payload, getMultipartConfig(payload)));

export const updateImage = async (id, payload) =>
  unwrapResponse(await api.put(API_ENDPOINTS.products.image(id), payload, getMultipartConfig(payload)));

export const deleteImage = async (id) =>
  unwrapResponse(await api.delete(API_ENDPOINTS.products.image(id)));
