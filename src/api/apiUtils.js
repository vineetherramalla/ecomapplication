import { NAVBAR_GROUPS } from '../utils/constants';
import { getNormalizedApiError } from './errorHandler';
import { buildSpecificationSections } from '../utils/specifications';

const DEFAULT_STATUS = 'pending';
const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;

export const normalizeBaseUrl = (value) => {
  if (!value) {
    return '/api';
  }

  const normalizedValue = value.endsWith('/') && value !== '/' ? value.slice(0, -1) : value;
  return normalizedValue === '/' ? '' : normalizedValue;
};

export const unwrapResponse = (response) => response?.data ?? response ?? null;

const getAssetBaseUrl = () => {
  const basePath = import.meta.env.VITE_API_BASE_URL;

  if (
    typeof window !== 'undefined' &&
    basePath &&
    !ABSOLUTE_URL_PATTERN.test(basePath)
  ) {
    return window.location.origin;
  }

  const candidates = [basePath, import.meta.env.VITE_API_URL, import.meta.env.VITE_API_PROXY_TARGET];

  for (const candidate of candidates) {
    if (candidate && ABSOLUTE_URL_PATTERN.test(candidate)) {
      return normalizeBaseUrl(candidate);
    }
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

export const resolveAssetUrl = (value) => {
  if (!value) {
    return null;
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return null;
  }

  // If already absolute or special protocols, return as is
  if (
    ABSOLUTE_URL_PATTERN.test(rawValue) ||
    rawValue.startsWith('data:') ||
    rawValue.startsWith('blob:')
  ) {
    // If the URL is absolute and points to the backend API server,
    // rewrite it to a relative path so it goes through Vite's /media proxy.
    const apiUrl =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_PROXY_TARGET ||
      '';
    if (apiUrl && ABSOLUTE_URL_PATTERN.test(apiUrl)) {
      try {
        const apiOrigin = new URL(apiUrl).origin;
        const valueUrl = new URL(rawValue);
        const isLocalhost = valueUrl.hostname === 'localhost' || valueUrl.hostname === '127.0.0.1';

        if (valueUrl.origin === apiOrigin || isLocalhost) {
          return valueUrl.pathname + valueUrl.search + valueUrl.hash;
        }
      } catch {
        // Fall through
      }
    }
    return rawValue;
  }

  // Handle relative paths. 
  // If it's a backend asset (common in B2B), it needs to go through /media proxy.
  // We prioritize /media/ prefix for consistency.
  let cleanValue = rawValue;
  if (!cleanValue.startsWith('/')) {
    // If it doesn't have /media/ or /static/ or /api/, it's likely a raw relative path from Django
    if (!cleanValue.startsWith('media/') && !cleanValue.startsWith('static/') && !cleanValue.startsWith('api/')) {
       cleanValue = `/media/${cleanValue}`;
    } else {
       cleanValue = `/${cleanValue}`;
    }
  }

  const baseUrl = getAssetBaseUrl();
  if (!baseUrl) {
    return cleanValue;
  }

  try {
    return new URL(cleanValue.replace(/^\//, ''), `${baseUrl}/`).toString();
  } catch {
    return cleanValue;
  }
};

export const extractList = (payload) => {
  const data = unwrapResponse(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const getEntityId = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'object') {
    return value.id ?? value.pk ?? value.slug ?? value.name ?? null;
  }

  return value;
};

const normalizeCatalogLookups = (catalog = {}) => {
  if (Array.isArray(catalog)) {
    return {
      categories: catalog,
      subcategories: [],
      brands: [],
    };
  }

  return {
    categories: Array.isArray(catalog?.categories) ? catalog.categories : [],
    subcategories: Array.isArray(catalog?.subcategories) ? catalog.subcategories : [],
    brands: Array.isArray(catalog?.brands) ? catalog.brands : [],
  };
};

const getEntityLabel = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return String(value.name || value.title || value.label || '').trim();
  }

  return String(value).trim();
};

const findLookupMatch = (value, items = [], normalizer) => {
  if (!Array.isArray(items) || !items.length || value === null || value === undefined || value === '') {
    return null;
  }

  const entityId = getEntityId(value);
  const entityLabel = getEntityLabel(value).toLowerCase();

  return items.find((item) => {
    const normalizedItem = normalizer(item);
    if (!normalizedItem) {
      return false;
    }

    const itemId = getEntityId(normalizedItem);
    const itemLabel = getEntityLabel(normalizedItem).toLowerCase();

    return (entityId !== null && String(itemId) === String(entityId)) || (entityLabel && itemLabel === entityLabel);
  }) || null;
};

export const getCategoryName = (category, categories = []) => {
  if (!category) {
    return 'Uncategorized';
  }

  const lookupMatch = findLookupMatch(category, categories, normalizeCategory);
  if (lookupMatch?.name) {
    return lookupMatch.name;
  }

  const normalizedCategory = normalizeCategory(category);
  if (normalizedCategory?.name && normalizedCategory.name !== 'Unnamed category') {
    return normalizedCategory.name;
  }

  return String(category || '').trim() || 'Uncategorized';
};

const normalizeNavbarGroup = (value) => {
  if (!value) {
    return null;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  return (
    NAVBAR_GROUPS.find((group) => group.toLowerCase() === normalizedValue) ??
    NAVBAR_GROUPS.find((group) => group.toLowerCase().replace(/&/g, 'and') === normalizedValue.replace(/&/g, 'and')) ??
    String(value).trim()
  );
};

export const normalizeCategory = (category) => {
  if (!category) {
    return null;
  }

  if (typeof category === 'string' || typeof category === 'number') {
    return {
      id: String(category),
      name: String(category),
      navbar_group: null,
    };
  }

  return {
    ...category,
    id: category.id ?? category.pk ?? category.slug ?? category.name,
    name: category.name || category.title || category.label || 'Unnamed category',
    parent:
      category.parent?.id ??
      category.parent_id ??
      category.parent ??
      category.parentCategory?.id ??
      category.parentCategory ??
      null,
    navbar_group: normalizeNavbarGroup(
      category.navbar_group ??
      category.navbarGroup ??
      category.group_name ??
      category.group ??
      category.nav_group ??
      category.navbar_group_display,
    ),
    image: resolveAssetUrl(category.image || category.url || category.file || category.icon || null),
    icon: resolveAssetUrl(category.icon || category.image || null),
  };
};

export const normalizeCategories = (payload) => extractList(payload).map(normalizeCategory).filter(Boolean);

export const normalizeSubcategory = (subcategory, fallbackCategoryId = null) => {
  if (!subcategory) {
    return null;
  }

  if (typeof subcategory === 'string' || typeof subcategory === 'number') {
    return {
      id: String(subcategory),
      name: String(subcategory),
      category_id: fallbackCategoryId,
    };
  }

  return {
    ...subcategory,
    id: subcategory.id ?? subcategory.pk ?? subcategory.slug ?? subcategory.name,
    name: subcategory.name || subcategory.title || subcategory.label || 'Unnamed subcategory',
    category_id:
      subcategory.parent ??
      fallbackCategoryId ??
      null,
    image: resolveAssetUrl(subcategory.image || subcategory.url || subcategory.file || null),
  };
};

export const normalizeSubcategories = (payload, fallbackCategoryId = null) =>
  extractList(payload)
    .map((subcategory) => normalizeSubcategory(subcategory, fallbackCategoryId))
    .filter(Boolean);

export const getSubcategoryName = (subcategory, subcategories = []) => {
  if (!subcategory) {
    return '';
  }

  const lookupMatch = findLookupMatch(subcategory, subcategories, normalizeSubcategory);
  if (lookupMatch?.name) {
    return lookupMatch.name;
  }

  const normalizedSubcategory = normalizeSubcategory(subcategory);
  if (normalizedSubcategory?.name && normalizedSubcategory.name !== 'Unnamed subcategory') {
    return normalizedSubcategory.name;
  }

  return String(subcategory || '').trim();
};

export const normalizeBrand = (brand) => {
  if (!brand) return null;
  if (typeof brand === 'string' || typeof brand === 'number') {
    return { id: String(brand), name: String(brand) };
  }
  return {
    ...brand,
    id: brand.id ?? brand.pk,
    name: brand.name || 'Unnamed brand',
    logo: resolveAssetUrl(brand.logo || brand.image || brand.url || null),
  };
};

export const normalizeBrands = (payload) => extractList(payload).map(normalizeBrand).filter(Boolean);

export const getBrandName = (brand, brands = []) => {
  if (!brand) {
    return '';
  }

  if (typeof brand === 'object') {
    return String(brand.name || brand.title || brand.label || '').trim();
  }

  const rawBrand = String(brand).trim();
  if (!rawBrand) {
    return '';
  }

  const matchedBrand = Array.isArray(brands)
    ? brands.find(
        (item) =>
          String(item?.id) === rawBrand ||
          String(item?.name || '')
            .trim()
            .toLowerCase() === rawBrand.toLowerCase(),
      )
    : null;

  return matchedBrand?.name || rawBrand;
};

export const normalizeProduct = (product, catalog = {}) => {
  if (!product) {
    return null;
  }

  const { categories, subcategories, brands } = normalizeCatalogLookups(catalog);
  const categorySource =
    product.category ??
    product.category_details ??
    product.category_data ??
    product.category_id ??
    product.category_name ??
    product.category_title;

  const subcategorySource =
    product.subcategory ??
    product.subcategory_details ??
    product.subcategory_data ??
    product.subcategory_id ??
    product.subcategory_name ??
    product.subcategory_title;

  const specifications = product.specifications || {
    resolution: product.resolution,
    brightness: product.brightness,
    contrast_ratio: product.contrast_ratio,
    connectivity: product.connectivity,
    screen_size: product.screen_size,
  };

  const imagesSource =
    product.images ??
    product.gallery ??
    product.gallery_images ??
    product.image_urls ??
    product.image;

  const resolveImageUrl = (img) => {
    if (!img) return null;
    let url = null;

    if (typeof img === 'string') {
      url = img;
    } else {
      url = img.image || img.url || img.src || img.file || null;
    }

    return resolveAssetUrl(url);
  };

  const images = Array.isArray(imagesSource)
    ? imagesSource.map(resolveImageUrl).filter(Boolean)
    : [resolveImageUrl(product.image_url), resolveImageUrl(product.thumbnail), resolveImageUrl(imagesSource)].filter(Boolean);


  const normalizedCategory =
    findLookupMatch(categorySource, categories, normalizeCategory) ?? normalizeCategory(categorySource);
  const normalizedSubcategory =
    findLookupMatch(subcategorySource, subcategories, normalizeSubcategory) ??
    normalizeSubcategory(subcategorySource);
  const rawBrand = product.brand ?? product.manufacturer ?? '';
  const brandName = getBrandName(rawBrand, brands);

  // Grouping specifications for the UI
  let normalizedSpecifications = [];
  if (Array.isArray(specifications) && specifications.length > 0) {
    // If it's already a flat array of records (with key/value/section), group them
    if (specifications[0] && (specifications[0].section || specifications[0].key)) {
      const sections = buildSpecificationSections(specifications);
      normalizedSpecifications = sections.map(s => ({
        category: s.title,
        items: s.items.map(item => ({
          key: item.label || item.key,
          value: item.value
        }))
      }));
    } else {
      // Already in grouped format?
      normalizedSpecifications = specifications;
    }
  } else if (specifications && typeof specifications === 'object') {
    const entries = Object.entries(specifications)
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
      .map(([key, value]) => ({ key, value: String(value).trim() }));
    
    if (entries.length > 0) {
      normalizedSpecifications = [{ category: 'General', items: entries }];
    }
  }

  return {
    ...product,
    id: product.id ?? product.pk,
    name: product.name || product.title || 'Untitled product',
    brand: typeof rawBrand === 'object' && rawBrand !== null ? rawBrand : rawBrand,
    brandName,
    description: product.description || product.summary || '',
    image: images[0] || resolveImageUrl(product.image_url) || resolveImageUrl(product.thumbnail) || null,
    category: normalizedCategory,
    categoryId: normalizedCategory?.id ?? getEntityId(categorySource),
    categoryName: getCategoryName(categorySource, categories),
    subcategory: getSubcategoryName(subcategorySource, subcategories),
    subcategoryId: normalizedSubcategory?.id ?? getEntityId(subcategorySource),
    subcategoryData: normalizedSubcategory,
    stock: Number(product.stock ?? product.inventory?.stock ?? product.quantity ?? 0),
    rating: Number(product.rating ?? 0),
    soldCount: Number(product.soldCount ?? product.sold_count ?? product.sales_count ?? 0),
    featured: Boolean(product.featured ?? product.is_featured),
    topSelling: Boolean(product.topSelling ?? product.top_selling),
    isNew: Boolean(product.isNew ?? product.is_new ?? product.new_arrival),
    top_selling: Boolean(product.topSelling ?? product.top_selling),
    new_arrival: Boolean(product.isNew ?? product.is_new ?? product.new_arrival),
    createdAt: product.createdAt || product.created_at || null,
    images: images.filter(Boolean),
    gallery: images.filter(Boolean).map((url, index) => {
      // Find original object metadata if available in imagesSource
      const original = Array.isArray(imagesSource) ? imagesSource[index] : (imagesSource && typeof imagesSource === 'object' ? imagesSource : null);
      return {
        id: original?.id,
        url: url,
        display_order: original?.display_order ?? index
      };
    }),
    specification_records: product.specification_records || [],
    specifications: normalizedSpecifications,
    highlights: (() => {
      const h = product.highlights ?? product.product_highlights ?? product.key_features ?? [];
      let rawArray = [];

      if (typeof h === 'string') {
        if (h.startsWith('[') || h.startsWith('{')) {
          try {
            const parsed = JSON.parse(h);
            rawArray = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            rawArray = [h];
          }
        } else {
          rawArray = [h];
        }
      } else if (Array.isArray(h)) {
        rawArray = h;
      } else if (h) {
        rawArray = [h];
      }

      return rawArray
        .flatMap((item) => {
          const text = typeof item === 'object' && item !== null ? item.text || item.value || '' : String(item);
          return text.split(/\r?\n/);
        })
        .map((item) => item.trim())
        .filter(Boolean);
    })(),
  };
};

export const normalizeProducts = (payload, catalog = {}) =>
  extractList(payload).map((product) => normalizeProduct(product, catalog)).filter(Boolean);

export const normalizePriceRequest = (request) => {
  if (!request) {
    return null;
  }

  const productSource = request.product;
  const isObject = productSource && typeof productSource === 'object';
  
  const product = isObject
    ? normalizeProduct(productSource)
    : {
        id: productSource || request.product_id,
        name: request.product_name || request.productName || 'Requested Product',
        brand: '',
        category: null,
        images: [],
        specifications: {},
      };

  if (product && (product.name === 'Untitled product' || !product.name)) {
    product.name = request.product_name || request.productName || request.product_details?.name || request.product?.name || product.name || 'Requested Product';
  }

  return {
    ...request,
    id: request.id ?? request.pk,
    name: request.name || request.customer_name || request.full_name || 'Unknown customer',
    email: request.email || request.customer_email || '',
    contactNumber: request.contactNumber || request.contact_number || request.phone || request.mobile || '',
    message: request.message || request.description || request.notes || request.inquiry_message || '',
    quantity: Math.max(1, Number(request.quantity ?? 1) || 1),
    status: request.status || DEFAULT_STATUS,
    quotedPrice:
      request.quotedPrice !== undefined && request.quotedPrice !== null
        ? Number(request.quotedPrice)
        : request.quoted_price !== undefined && request.quoted_price !== null
          ? Number(request.quoted_price)
          : request.quote_price !== undefined && request.quote_price !== null
            ? Number(request.quote_price)
            : null,
    createdAt: request.created_at || request.createdAt || request.date || null,
    updatedAt: request.updated_at || request.updatedAt || null,
    product,
  };
};

export const normalizeInventoryItem = (item, categories = [], subcategories = []) => {
  if (!item) return null;
  
  let product = null;
  if (item.product && typeof item.product === 'object') {
     product = normalizeProduct(item.product, { categories, subcategories });
  } else {
     product = { 
       id: item.product || item.product_id, 
       name: item.product_name || 'Managed Product' 
     };
  }

  return {
    ...item,
    id: item.id ?? item.pk,
    stock: Number(item.stock ?? 0),
    product,
  };
};

export const normalizeInventoryItems = (response, categories = [], subcategories = []) => {
  const data = unwrapResponse(response);
  const items = Array.isArray(data) ? data : (data?.results || []);
  return items.map(item => normalizeInventoryItem(item, categories, subcategories));
};

export const normalizePriceRequests = (payload) => extractList(payload).map(normalizePriceRequest).filter(Boolean);

const AUTH_CONTAINER_KEYS = ['data', 'result', 'results', 'payload', 'auth', 'token', 'tokens', 'credentials'];
const ACCESS_TOKEN_KEYS = [
  'access_token',
  'access',
  'token',
  'accessToken',
  'jwt',
  'key',
  'auth_token',
  'authToken',
  'id',
  'sessionid',
  'id_token',
  'idToken',
];
const REFRESH_TOKEN_KEYS = ['refresh_token', 'refresh', 'refreshToken'];
const AUTH_USER_KEYS = [
  'admin',
  'user',
  'profile',
  'account',
  'me',
  'customer',
  'data',
  'details',
  'auth',
];

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getStringValue = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
};

const findFirstStringValue = (objects, keys) => {
  const lowerKeys = keys.map(k => k.toLowerCase());
  for (const object of objects) {
    if (!object || typeof object !== 'object') continue;
    const objectKeys = Object.keys(object);
    for (const objKey of objectKeys) {
      if (lowerKeys.includes(objKey.toLowerCase())) {
        const candidate = getStringValue(object[objKey]);
        if (candidate) return candidate;
      }
    }
  }
  return '';
};

const findFirstObjectValue = (objects, keys) => {
  for (const object of objects) {
    for (const key of keys) {
      const candidate = object?.[key];
      if (isPlainObject(candidate)) {
        return candidate;
      }
    }
  }

  return null;
};

const collectAuthObjects = (value, depth = 0, visited = new Set()) => {
  if (!isPlainObject(value) || visited.has(value)) {
    return [];
  }

  visited.add(value);

  const objects = [value];
  if (depth >= 3) {
    return objects;
  }

  AUTH_CONTAINER_KEYS.forEach((key) => {
    const nestedValue = value[key];

    if (Array.isArray(nestedValue)) {
      nestedValue.forEach((entry) => {
        objects.push(...collectAuthObjects(entry, depth + 1, visited));
      });
      return;
    }

    objects.push(...collectAuthObjects(nestedValue, depth + 1, visited));
  });

  return objects;
};

const decodeJwt = (token) => {
  if (!token) return {};
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
};

export const extractAuthData = (payload) => {
  if (!payload) {
    return { token: null, admin: null };
  }

  // Handle case where we receive the raw axios response vs unwrapped data
  let data = payload.data !== undefined ? payload.data : payload;
  const headers = payload.headers || {};

  // If data is a string, try to parse it as JSON
  if (typeof data === 'string' && data.trim().startsWith('{')) {
    try {
      data = JSON.parse(data);
    } catch {
      // Not a valid JSON string, keep as is
    }
  }

  // If payload itself is a string that looks like a JWT token
  if (typeof data === 'string' && (data.split('.').length === 3 || /^[a-z0-9-]{30,}$/i.test(data.toLowerCase()))) {
    return { token: data, admin: decodeJwt(data), access: data, access_token: data };
  }

  // Collect all potential containers (including arrays)
  const candidates = [];
  if (isPlainObject(data)) {
    candidates.push(data);
  } else if (Array.isArray(data)) {
    candidates.push(...data.filter(isPlainObject));
  }

  // Search recursively using the robust collectors
  const authObjects = collectAuthObjects(data);
  candidates.push(...authObjects);

  // Uniquify candidates
  const uniqueCandidates = Array.from(new Set(candidates));

  // Find the token
  let token = findFirstStringValue(uniqueCandidates, ACCESS_TOKEN_KEYS) || null;
  let refreshToken = findFirstStringValue(uniqueCandidates, REFRESH_TOKEN_KEYS) || null;
  let admin = findFirstObjectValue(uniqueCandidates, AUTH_USER_KEYS) || null;

  // Fallback to headers
  if (!token && headers) {
    const headerToken =
      headers.authorization?.replace(/^Bearer /i, '') ||
      headers['x-auth-token'] ||
      headers['access-token'] ||
      headers.token;
    
    if (headerToken) {
      token = headerToken;
    }
  }

  if (token && !admin) {
    const decoded = decodeJwt(token);
    if (decoded && Object.keys(decoded).length > 0) {
      admin = decoded;
    }
  }

  const result = {
    ...(isPlainObject(data) ? data : {}),
    token,
    admin,
    access: token || undefined,
    access_token: token || undefined,
    refresh: refreshToken || undefined,
    refresh_token: refreshToken || undefined,
  };

  return result;
};

export const resolveCategoryId = (categoryValue, categories = []) => {
  if (!categoryValue) {
    return null;
  }

  if (typeof categoryValue === 'object') {
    return getEntityId(categoryValue);
  }

  const match = findLookupMatch(categoryValue, categories, normalizeCategory);
  return match?.id ?? categoryValue;
};

export const resolveSubcategoryId = (subcategoryValue, subcategories = []) => {
  if (!subcategoryValue) {
    return null;
  }

  if (typeof subcategoryValue === 'object') {
    return getEntityId(subcategoryValue);
  }

  const match = findLookupMatch(subcategoryValue, subcategories, normalizeSubcategory);
  return match?.id ?? subcategoryValue;
};

export const serializeProductPayload = (product, catalog = {}, options = {}) => {
  const { legacy = false } = options;
  const { categories, subcategories } = normalizeCatalogLookups(catalog);
  const categoryId = resolveCategoryId(product.category_id ?? product.categoryId ?? product.category, categories);
  const rawSubcategoryValue =
    product.subcategory_id ?? product.subcategoryId ?? product.subcategoryData ?? product.subcategory;
  const subcategoryId = resolveSubcategoryId(rawSubcategoryValue, subcategories);
  const brandValue = product.brand?.id ?? product.brandId ?? product.brand;
  const highlightsValue = Array.isArray(product.highlights)
    ? product.highlights
        .map((highlight) => String(highlight || '').trim())
        .filter(Boolean)
        .join('\n')
    : String(product.highlights || '').trim();

  const payload = {
    name: product.name?.trim()?.slice(0, 255),
    brand: brandValue ? Number(brandValue) : null,
    description: product.description?.trim(),
    featured: Boolean(product.featured),
    top_selling: Boolean(product.topSelling ?? product.top_selling),
    new_arrival: Boolean(product.isNew ?? product.new_arrival),
    highlights: highlightsValue,
    mpn: product.mpn?.trim() || '',
    sku: product.sku?.trim() || '',
  };

  const numericSubcategoryId = subcategoryId ? Number(subcategoryId) : null;

  if (legacy) {
    payload.category = categoryId ?? product.category;
    payload.subcategory = subcategoryId ?? (typeof rawSubcategoryValue === 'object' ? rawSubcategoryValue?.name || '' : rawSubcategoryValue || '');
  } else {
    payload.category = categoryId ?? null;
    payload.subcategory = numericSubcategoryId;
  }

  return payload;
};

export const serializeProductFormData = (data, catalog = {}, options = {}) => {
  const { legacy = false } = options;
  const formData = new FormData();
  const payload = serializeProductPayload(data, catalog, { legacy });

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

export const serializePriceRequestPayload = (data) => {
  const productIdValue = data.product?.id ?? data.product;
  const isNumeric = productIdValue && !isNaN(Number(productIdValue));
  const productId = isNumeric ? Number(productIdValue) : null;
  const productName = !isNumeric ? (data.product_name || data.productName || data.product || null) : null;

  return {
    name: String(data.name || 'Partner').trim().slice(0, 250),
    email: String(data.email || '').trim().toLowerCase(),
    phone: String(data.contactNumber || data.phone || '').trim().slice(0, 20),
    company_name: String(data.company_name || data.companyName || '').trim().slice(0, 250),
    company_address: String(data.company_address || data.companyAddress || '').trim(),
    description: String(data.message || data.description || '').trim(),
    quantity: Math.max(1, Math.floor(Number(data.quantity ?? 1)) || 1),
    product: productId,
    product_name: productName,
  };
};


export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  return getNormalizedApiError(error, { fallbackMessage: fallback }).message;
};
