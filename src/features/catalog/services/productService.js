import {
  createProduct as createProductApi,
  deleteProduct as deleteProductApi,
  getProductById as getProductByIdApi,
  getProducts as getProductsApi,
  updateProduct as updateProductApi,
} from '@/api/productApi';

export const getProducts = getProductsApi;
export const getProductById = getProductByIdApi;
export const createProduct = createProductApi;
export const updateProduct = updateProductApi;
export const deleteProduct = deleteProductApi;

export const productService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAll: getProducts,
  getById: getProductById,
  create: createProduct,
  update: updateProduct,
  remove: deleteProduct,
};

export default productService;
