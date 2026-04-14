import * as inventoryApi from '@/api/inventoryApi';

export const getInventory = async () => inventoryApi.getInventory();

export const updateStock = async (id, productId, stock) =>
  inventoryApi.updateInventory(id, {
    product: productId,
    stock: Number(stock),
  });

export const createInventory = async (payload) => {
  const formattedPayload = {
    product_id: payload.product_id || payload.product,
    stock: Number(payload.stock || 0),
  };
  return inventoryApi.createInventory(formattedPayload);
};

export const inventoryService = {
  getInventory,
  updateStock,
  createInventory,
};

export default inventoryService;
