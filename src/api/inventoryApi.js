import api from './axiosInstance';
import { normalizeInventoryItems, unwrapResponse } from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

export const getInventory = async () => normalizeInventoryItems(await api.get(API_ENDPOINTS.inventory.items));

export const getInventoryById = async (id) =>
  unwrapResponse(await api.get(API_ENDPOINTS.inventory.item(id)));

export const createInventory = async (payload) =>
  unwrapResponse(await api.post(API_ENDPOINTS.inventory.items, payload));

export const updateInventory = async (id, payload) =>
  unwrapResponse(await api.put(API_ENDPOINTS.inventory.item(id), payload));

export const updateInventoryStock = async (id, stock) =>
  updateInventory(id, { stock: Number(stock) });

export const getInventoryByProductId = async (productId) => {
  const all = await getInventory();
  return all.find((item) => String(item.product?.id || item.product_id || item.product) === String(productId)) || null;
};

export const deleteInventory = (id) => api.delete(API_ENDPOINTS.inventory.item(id));
