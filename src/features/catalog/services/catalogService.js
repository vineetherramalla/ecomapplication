import { getBrands } from '@/api/brandApi';
import { normalizeSubcategory } from '@/api/apiUtils';
import { buildCategoryTree, getCategories } from '@/features/catalog/services/categoryService';
import { getSubcategoriesForCategories } from '@/features/catalog/services/subcategoryService';
import { getProductOptions } from '@/api/productApi';

const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PRODUCT_FLAGS = [
  { key: 'featured', label: 'Featured' },
  { key: 'top_selling', label: 'Top Selling' },
  { key: 'new_arrival', label: 'New Arrival' },
];

let catalogCache = {
  data: null,
  timestamp: 0,
  promise: null,
};

const getParentCategoryId = (category) =>
  category?.parent?.id ?? category?.parent_id ?? category?.parent ?? null;

const isCatalogCacheFresh = () =>
  catalogCache.data && Date.now() - catalogCache.timestamp < CATALOG_CACHE_TTL_MS;

const buildEmbeddedSubcategoryMaps = (categories = []) => {
  const byCategory = {};
  const all = [];

  categories.forEach((category) => {
    const categoryId = category?.id;
    if (!categoryId) {
      return;
    }

    const embeddedChildren = Array.isArray(category.subcategories)
      ? category.subcategories
      : Array.isArray(category.children)
        ? category.children
        : [];

    if (!embeddedChildren.length) {
      return;
    }

    const normalizedChildren = embeddedChildren
      .map((subcategory) => normalizeSubcategory(subcategory, categoryId))
      .filter(Boolean);

    if (!normalizedChildren.length) {
      return;
    }

    byCategory[String(categoryId)] = normalizedChildren;
    all.push(...normalizedChildren);
  });

  return {
    all,
    byCategory,
  };
};

const buildCatalog = async (options = {}) => {
  const [categories, brands, productOptions] = await Promise.all([
    getCategories(),
    getBrands(options),
    getProductOptions(),
  ]);

  const topLevelCategories = Array.isArray(categories)
    ? categories.filter((category) => !getParentCategoryId(category))
    : [];
  const embeddedSubcategories = buildEmbeddedSubcategoryMaps(topLevelCategories);
  const hasEmbeddedSubcategories = Object.keys(embeddedSubcategories.byCategory).length > 0;
  const { all: subcategories, byCategory: subcategoriesByCategory } = hasEmbeddedSubcategories
    ? embeddedSubcategories
    : await getSubcategoriesForCategories(topLevelCategories, options);

  const optionFields = [
    productOptions?.actions?.POST,
    productOptions?.actions?.PATCH,
    productOptions?.actions?.PUT,
  ].filter(Boolean);

  const productFlags = DEFAULT_PRODUCT_FLAGS.filter(({ key }) =>
    optionFields.some((fields) => fields[key]?.type === 'boolean'),
  ).map(({ key, label }) => {
    const meta = optionFields.find((fields) => fields[key])?.[key];
    return {
      key,
      label: meta?.label || label,
    };
  });

  return {
    categories: topLevelCategories,
    subcategories,
    subcategoriesByCategory,
    brands,
    productFlags: productFlags.length > 0 ? productFlags : DEFAULT_PRODUCT_FLAGS,
    categoryTree: buildCategoryTree(topLevelCategories, subcategoriesByCategory),
  };
};

export const getCatalogData = async (options = {}) => {
  if (!options.force && isCatalogCacheFresh()) {
    return catalogCache.data;
  }

  if (!options.force && catalogCache.promise) {
    return catalogCache.promise;
  }

  const request = buildCatalog(options)
    .then((data) => {
      catalogCache = {
        data,
        timestamp: Date.now(),
        promise: null,
      };

      return data;
    })
    .finally(() => {
      catalogCache.promise = null;
    });

  catalogCache.promise = request;
  return request;
};

const catalogService = {
  getCatalogData,
};

export default catalogService;
