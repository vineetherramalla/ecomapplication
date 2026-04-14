import {
  createSubcategory as postSubcategory,
  deleteSubcategory as removeSubcategory,
  getSubcategories as fetchSubcategories,
  getSubcategoryById as fetchSubcategoryById,
  updateSubcategory as putSubcategory,
} from '@/api/subcategoryApi';
import { runCatalogMutation, runServiceAction } from '@/features/catalog/services/serviceHelpers';
import logger from '@/shared/lib/logger';

const SUBCATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;
const subcategoryCache = new Map();

const isCacheEntryFresh = (entry) =>
  entry && Date.now() - entry.timestamp < SUBCATEGORY_CACHE_TTL_MS;

const clearSubcategoryCache = () => {
  subcategoryCache.clear();
};

export const getSubcategories = async (parentId, options = {}) => {
  const cacheKey = String(parentId || '');
  const cachedEntry = subcategoryCache.get(cacheKey);

  if (!options.force && isCacheEntryFresh(cachedEntry)) {
    return cachedEntry.data;
  }

  return runServiceAction(async () => {
    const subcategories = await fetchSubcategories(parentId);
    subcategoryCache.set(cacheKey, {
      data: subcategories,
      timestamp: Date.now(),
    });
    return subcategories;
  }, 'Error fetching subcategories:');
};

export const getSubcategoryById = async (categoryId, id) =>
  runServiceAction(
    () => fetchSubcategoryById(categoryId, id),
    `Error fetching subcategory with id ${id} in category ${categoryId}:`,
  );

export const createSubcategory = async (data) =>
  runCatalogMutation(
    () => postSubcategory(data.categoryId, data.payload),
    'Error creating subcategory:',
    clearSubcategoryCache,
  );

export const updateSubcategory = async (id, data) =>
  runCatalogMutation(async () => {
    const categoryId = data.categoryId ?? data.parentId ?? data.category_id;
    if (!categoryId) {
      throw new Error('Category ID (categoryId) is required to update a subcategory');
    }

    return putSubcategory(categoryId, id, data.payload ?? data);
  }, `Error updating subcategory with id ${id}:`, clearSubcategoryCache);

export const deleteSubcategory = async (subcategoryOrId, categoryId) =>
  runCatalogMutation(async () => {
    const resolvedId =
      typeof subcategoryOrId === 'object' ? subcategoryOrId?.id ?? subcategoryOrId?.pk : subcategoryOrId;
    if (!resolvedId) {
      throw new Error('Subcategory ID is required to delete a subcategory');
    }

    const resolvedCategoryId =
      categoryId ??
      (typeof subcategoryOrId === 'object'
        ? subcategoryOrId?.categoryId ??
          subcategoryOrId?.category_id ??
          subcategoryOrId?.parentId ??
          subcategoryOrId?.parent_id
        : null);

    return removeSubcategory(resolvedCategoryId, resolvedId);
  }, `Error deleting subcategory with id ${subcategoryOrId}:`, clearSubcategoryCache);

export const getSubcategoriesForCategories = async (categories = [], options = {}) => {
  const results = [];
  const batchSize = 3;

  for (let index = 0; index < categories.length; index += batchSize) {
    const batch = categories.slice(index, index + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (category) => {
        const categoryId = typeof category === 'object' ? category.id : category;

        if (!categoryId) {
          return [null, []];
        }

        try {
          const subcategories = await getSubcategories(categoryId, options);
          return [String(categoryId), subcategories];
        } catch (error) {
          logger.error(`Error fetching subcategories for category ${categoryId}:`, error);
          return [String(categoryId), []];
        }
      }),
    );

    results.push(...batchResults);
  }

  const byCategory = Object.fromEntries(results.filter(([categoryId]) => categoryId));
  const all = results.flatMap(([, subcategories]) => subcategories);

  return {
    all,
    byCategory,
  };
};

export const subcategoryService = {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoriesForCategories,
  clearSubcategoryCache,
};

export default subcategoryService;
