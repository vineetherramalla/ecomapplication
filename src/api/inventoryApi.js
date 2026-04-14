import api from './axiosInstance';
import { normalizeInventoryItems, unwrapResponse } from './apiUtils';

export const getInventory = async () => normalizeInventoryItems(await api.get('/inventory/'));

export const getInventoryById = async (id) =>
  unwrapResponse(await api.get(`/inventory/${id}/`));

export const createInventory = async (payload) =>
  unwrapResponse(await api.post('/inventory/', payload));

export const updateInventory = async (id, payload) =>
  unwrapResponse(await api.put(`/inventory/${id}/`, payload));

export const updateInventoryStock = async (id, stock) =>
  updateInventory(id, { stock: Number(stock) });

export const getInventoryByProductId = async (productId) => {
  const all = await getInventory();
  return all.find((item) => String(item.product?.id || item.product_id || item.product) === String(productId)) || null;
};

export const deleteInventory = (id) => api.delete(`/inventory/${id}/`);
