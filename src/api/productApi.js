import api, { publicApi } from './axiosInstance';
import {
  normalizeProduct,
  normalizeProducts,
  resolveAssetUrl,
  serializeProductPayload,
  unwrapResponse,
} from './apiUtils';
import { fetchAllPages, fetchOptionalCollection } from './requestHelpers';
import { createImage, deleteImage, getImages, getImagesByProductId } from './imageApi';
import { touchCatalogSync } from '@/store/catalog/catalogSyncStore';
import authService from '@/features/auth/services/authService';
import { createInventory, getInventory, getInventoryByProductId, updateInventory } from './inventoryApi';
import {
  createSpecification,
  deleteSpecification,
  getSpecifications,
  getSpecificationsByProductId,
  updateSpecification,
} from './specificationApi';
import { buildSpecificationSections } from '../utils/specifications';
import logger from '@/shared/lib/logger';

const shouldRetryLegacyMutation = (error) =>
  error?.response?.status === 400 || error?.response?.status === 404;

const PRODUCT_REQUIRED_FIELDS = ['name', 'brand', 'category', 'subcategory'];
const PRODUCT_LIST_REQUESTS = new Map();
const clearProductListRequests = () => PRODUCT_LIST_REQUESTS.clear();

const getMissingProductFields = (data = {}) =>
  PRODUCT_REQUIRED_FIELDS.filter((field) => {
    if (field === 'name') {
      return !String(data.name || '').trim();
    }

    return data[field] === null || data[field] === undefined || data[field] === '';
  });

const validateProductMutationData = (data = {}) => {
  const missingFields = getMissingProductFields(data);
  if (!missingFields.length) {
    return;
  }

  const error = new Error(`Missing required product fields: ${missingFields.join(', ')}`);
  error.validationIssues = missingFields;
  throw error;
};

const buildProductPayloads = (data, catalog) => ({
  modernPayload: serializeProductPayload(data, catalog),
  legacyPayload: serializeProductPayload(data, catalog, { legacy: true }),
});

const getProductListRequestKey = () => (authService.isAuthenticated() ? 'authenticated' : 'public');

const groupImagesByProduct = (imageRecords = []) =>
  imageRecords.reduce((accumulator, imageRecord) => {
    const productId =
      imageRecord?.product ??
      imageRecord?.product_id ??
      imageRecord?.product?.id ??
      null;

    if (!productId) {
      return accumulator;
    }

    const imageUrl = resolveAssetUrl(
      imageRecord?.image ?? imageRecord?.url ?? imageRecord?.src ?? imageRecord?.file,
    );

    if (!imageUrl) {
      return accumulator;
    }

    const key = String(productId);
    const rawKey = `${key}_raw`;
    
    if (!accumulator[key]) {
      accumulator[key] = [];
      accumulator[rawKey] = [];
    }

    if (!accumulator[key].includes(imageUrl)) {
      accumulator[key].push(imageUrl);
      accumulator[rawKey].push(imageRecord);
    }

    return accumulator;
  }, {});

const mergeProductImages = (product, imageMap = {}) => {
  const mappedImages = imageMap[String(product.id)] || [];
  const mergedImages = [
    ...new Set(
      [
        ...mappedImages,
        ...(product.images || []),
        product.image || null,
      ].filter(Boolean),
    ),
  ];

  const rawImageObjects = imageMap[`${product.id}_raw`] || [];
  
  return {
    ...product,
    images: mergedImages,
    image: mappedImages[0] || mergedImages[0] || product.image || null,
    gallery: mergedImages.map((url, index) => {
      // Try to find the original record to preserve the ID
      const original = rawImageObjects.find(obj => {
         const objUrl = resolveAssetUrl(obj.image || obj.url || obj.file);
         return objUrl === url;
      });
      
      return {
        id: original?.id,
        url: url,
        display_order: original?.display_order ?? index
      };
    })
  };
};

const groupSpecificationsByProduct = (specificationRecords = []) =>
  specificationRecords.reduce((accumulator, record) => {
    const productId = record?.product ?? record?.product_id ?? record?.product?.id ?? null;
    if (!productId) return accumulator;

    const productKey = String(productId);
    if (!accumulator[productKey]) {
      accumulator[productKey] = {};
      accumulator[`${productKey}_records`] = [];
    }

    const key =
      record?.key ??
      record?.name ??
      record?.label ??
      record?.field ??
      record?.spec_key ??
      record?.specification_key;
    const value =
      record?.value ??
      record?.spec_value ??
      record?.field_value ??
      record?.specification_value;
    const section = record?.section || 'General';

    if (key && value !== undefined && value !== null && String(value).trim() !== '') {
      accumulator[productKey][String(key).trim()] = String(value).trim();
      accumulator[`${productKey}_records`].push({
        id: record.id,
        key: String(key).trim(),
        value: String(value).trim(),
        section: String(section).trim()
      });
    }

    return accumulator;
  }, {});

const mergeProductSpecifications = (product, specificationMap = {}) => {
  const pKey = String(product.id);
  const records = specificationMap[`${pKey}_records`] || [];
  
  // If we already have specifications in grouped format, we might need to flatten them to re-group,
  // but usually for products from DB we want to use the joined records as source of truth for UI categories.
  
  const sections = buildSpecificationSections(records);
  const groupedSpecs = sections.map(s => ({
    category: s.title,
    items: s.items.map(item => ({
      key: item.label || item.key,
      value: item.value
    }))
  }));

  return {
    ...product,
    specifications: groupedSpecs.length > 0 ? groupedSpecs : product.specifications,
    specification_records: records,
  };
};

const groupInventoryByProduct = (inventoryRecords = []) =>
  inventoryRecords.reduce((acc, item) => {
    const productId = item?.product?.id ?? item?.product_id ?? item?.product ?? null;
    if (productId !== null) {
      acc[String(productId)] = Number(item.stock ?? 0);
    }
    return acc;
  }, {});

const mergeProductInventory = (product, inventoryMap = {}) => {
  const pKey = String(product.id);
  const inventoryStock = inventoryMap[pKey];
  return {
    ...product,
    stock: inventoryStock !== undefined ? inventoryStock : (product.stock || 0),
  };
};

const enrichProduct = (product, relations) =>
  mergeProductInventory(
    mergeProductSpecifications(
      mergeProductImages(product, relations.imageMap),
      relations.specificationMap,
    ),
    relations.inventoryMap || {},
  );

const enrichProducts = (products = [], relations) =>
  products.map((product) => enrichProduct(product, relations));

const loadProductRelations = async (productId = null) => {
  const [imageRecords, specificationRecords, inventoryRecords] = await Promise.all([
    fetchOptionalCollection(
      () => (productId ? getImagesByProductId(productId) : getImages()),
      'Unable to fetch product images. Continuing without gallery joins.',
    ),
    fetchOptionalCollection(
      () => (productId ? getSpecificationsByProductId(productId) : getSpecifications()),
      'Unable to fetch product specifications. Continuing without specification joins.',
    ),
    fetchOptionalCollection(
      () => authService.isAuthenticated() ? getInventory() : Promise.resolve([]),
      'Unable to fetch inventory. Continuing without stock data.',
    ),
  ]);

  return {
    imageMap: groupImagesByProduct(imageRecords),
    specificationMap: groupSpecificationsByProduct(specificationRecords),
    inventoryMap: groupInventoryByProduct(inventoryRecords),
  };
};

const loadProductListBundle = async () => {
  const requestKey = getProductListRequestKey();
  if (PRODUCT_LIST_REQUESTS.has(requestKey)) {
    return PRODUCT_LIST_REQUESTS.get(requestKey);
  }

  const request = Promise.all([
    fetchAllPages(publicApi, '/products/'),
    loadProductRelations(),
  ]).finally(() => {
    PRODUCT_LIST_REQUESTS.delete(requestKey);
  });

  PRODUCT_LIST_REQUESTS.set(requestKey, request);
  return request;
};

const syncProductSpecifications = async (productId, specifications = []) => {
  const nextEntries = Array.isArray(specifications)
    ? specifications
        .map((specification) => ({
          key: String(specification?.key || '').trim(),
          value: String(specification?.value || '').trim(),
          section: String(specification?.section || 'General').trim() || 'General',
        }))
        .filter((specification) => specification.key && specification.value)
    : Object.entries(specifications)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => ({ key: k, value: v, section: 'General' }));

  const existingSpecificationRecords = await getSpecificationsByProductId(productId);

  const existingByCompositeKey = existingSpecificationRecords.reduce((acc, record) => {
    acc[`${record.section || 'General'}:${record.key}`] = record;
    return acc;
  }, {});

  await Promise.all(
    nextEntries.map((spec) => {
      const { key, value, section = 'General' } = spec;
      const composite = `${section}:${key}`;
      const existing = existingByCompositeKey[composite];
      const payload = { product: productId, key, value: String(value), section };
      return existing ? updateSpecification(existing.id, payload) : createSpecification(payload);
    }),
  );

  const nextKeys = nextEntries.map(s => `${s.section || 'General'}:${s.key}`);
  await Promise.all(
    existingSpecificationRecords
      .filter(r => !nextKeys.includes(`${r.section || 'General'}:${r.key}`))
      .map(r => deleteSpecification(r.id))
  );
};

const syncProductImages = async (productId, files = [], remaining_image_ids = []) => {
  const existing = await getImagesByProductId(productId);

  // If we receive an array of string IDs or numeric IDs, we keep them.
  // Anything not in remaining_image_ids gets deleted.
  // Safely map to strings for stable comparison.
  const keeps = remaining_image_ids.map(id => String(id));

  await Promise.all(
    existing
      .filter(img => !keeps.includes(String(img.id)))
      .map(img => deleteImage(img.id))
  );

  const nextFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  if (nextFiles.length > 0) {
    await Promise.all(nextFiles.map(file => {
      const fd = new FormData();
      fd.append('product', productId);
      fd.append('image', file);
      return createImage(fd);
    }));
  }
};

const runProductMutation = async (method, url, modernPayload, legacyPayload) => {
  logger.info('Product API request payload', {
    method: method.toUpperCase(),
    url,
    payload: modernPayload,
  });

  try {
    const response = unwrapResponse(await api[method](url, modernPayload));
    logger.info('Product API response', {
      method: method.toUpperCase(),
      url,
      response,
    });
    return response;
  } catch (error) {
    logger.error('Product API request failed', {
      method: method.toUpperCase(),
      url,
      payload: modernPayload,
      error,
    });

    if (!shouldRetryLegacyMutation(error)) {
      throw error;
    }

    logger.warn('Retrying product API request with legacy payload', {
      method: method.toUpperCase(),
      url,
      payload: legacyPayload,
    });

    const response = unwrapResponse(await api[method](url, legacyPayload));
    logger.info('Product API response', {
      method: method.toUpperCase(),
      url,
      response,
    });
    return response;
  }
};

const updateBaseProduct = async (id, data, catalog) => {
  const { modernPayload, legacyPayload } = buildProductPayloads(data, catalog);
  return runProductMutation('put', `/products/${id}/`, modernPayload, legacyPayload);
};

const buildProductSideEffectTasks = (productId, data = {}) => {
  const tasks = [
    {
      warning: 'Specs sync failed',
      run: () => syncProductSpecifications(productId, data.specifications || []),
    },
    {
      warning: 'Images sync failed',
      run: () =>
        syncProductImages(
          productId,
          Array.isArray(data.files) ? data.files : [],
          Array.isArray(data.remaining_image_ids) ? data.remaining_image_ids : [],
        ),
    },
  ];

  if (data.stock !== undefined) {
    tasks.push({
      warning: 'Inventory sync failed',
      run: async () => {
        const stockValue = Number(data.stock);
        const existing = await getInventoryByProductId(productId);
        if (existing) {
          return updateInventory(existing.id, { product: productId, stock: stockValue });
        }
        return createInventory({ product: productId, stock: stockValue });
      },
    });
  }

  return tasks;
};

const runProductSideEffects = async (productId, data = {}) => {
  const tasks = buildProductSideEffectTasks(productId, data);

  await Promise.all(
    tasks.map(({ warning, run }) =>
      run().catch((error) => {
        logger.warn(warning, error);
      }),
    ),
  );
};

export const getProducts = async (catalog) => {
  try {
    const [products, relations] = await loadProductListBundle();

    return enrichProducts(normalizeProducts(products, catalog), relations);
  } catch (error) {
    logger.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductSummaries = async (catalog) => {
  try {
    const products = await fetchAllPages(publicApi, '/products/');
    return normalizeProducts(products, catalog);
  } catch (error) {
    logger.error('Error fetching product summaries:', error);
    throw error;
  }
};

export const getProductById = async (id, catalog) => {
  try {
    const [productResponse, relations] = await Promise.all([
      publicApi.get(`/products/${id}/`),
      loadProductRelations(id),
    ]);

    const normalizedProduct = normalizeProduct(unwrapResponse(productResponse), catalog);
    return enrichProduct(normalizedProduct, relations);
  } catch (error) {
    logger.error(`Error fetching product with ID ${id}:`, error);
    throw error;
  }
};

export const createProduct = async (data, catalog) => {
  try {
    validateProductMutationData(data);
    clearProductListRequests();
    const { modernPayload, legacyPayload } = buildProductPayloads(data, catalog);

    const product = await runProductMutation('post', '/products/', modernPayload, legacyPayload);
    const productId = product.id ?? product.pk;

    // Run remaining side effects (Specs, Stock, Images)
    await runProductSideEffects(productId, data);

    const result = await getProductById(productId, catalog);
    touchCatalogSync();
    return result;
  } catch (error) {
    logger.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id, data, catalog) => {
  try {
    validateProductMutationData(data);
    clearProductListRequests();
    await updateBaseProduct(id, data, catalog);
    await runProductSideEffects(id, data);
    const result = await getProductById(id, catalog);
    touchCatalogSync();
    return result;
  } catch (error) {
    logger.error(`Error updating product with ID ${id}:`, error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    clearProductListRequests();
    const result = await api.delete(`/products/${id}/`);
    logger.info('Product API response', {
      method: 'DELETE',
      url: `/products/${id}/`,
      response: unwrapResponse(result),
    });
    touchCatalogSync();
    return result;
  } catch (error) {
    logger.error(`Error deleting product with ID ${id}:`, error);
    throw error;
  }
};

export const getProductOptions = async () => {
  try {
    // Only attempt if authenticated to avoid 401 loops for guests
    if (!authService.isAuthenticated()) {
      return null;
    }

    // Use authenticated api instance to include Bearer token
    const response = await api.options('/products/');
    logger.info('Product API response', {
      method: 'OPTIONS',
      url: '/products/',
      response: response.data,
    });
    return response.data;
  } catch (error) {
    logger.error('Error fetching product options:', error);
    return null;
  }
};
