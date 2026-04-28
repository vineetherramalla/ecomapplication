import api from './axiosInstance';
import {
  normalizePriceRequest,
  normalizePriceRequests,
  serializePriceRequestPayload,
  unwrapResponse,
} from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

export const getPriceRequests = async () => normalizePriceRequests(await api.get(API_ENDPOINTS.orders.requests));

export const getPriceRequestById = async (id) =>
  normalizePriceRequest(unwrapResponse(await api.get(API_ENDPOINTS.orders.request(id))));

export const createPriceRequest = async (data) =>
  normalizePriceRequest(unwrapResponse(await api.post(API_ENDPOINTS.orders.requests, serializePriceRequestPayload(data))));

const updatePriceRequestWithFallback = async (id, data) => {
  return unwrapResponse(await api.put(API_ENDPOINTS.orders.request(id), data));
};

export const updatePriceRequest = async (id, data) =>
  normalizePriceRequest(await updatePriceRequestWithFallback(id, data));

export const updatePriceRequestStatus = async (id, status) =>
  normalizePriceRequest(await updatePriceRequestWithFallback(id, { status }));

export const deletePriceRequest = (id) => api.delete(API_ENDPOINTS.orders.request(id));
