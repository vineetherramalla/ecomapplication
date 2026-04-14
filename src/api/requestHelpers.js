import { extractList, unwrapResponse } from './apiUtils';
import logger from '@/shared/lib/logger';

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const appendQueryParams = (url, params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (hasValue(value)) {
      searchParams.append(key, value);
    }
  });

  if (!searchParams.toString()) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${searchParams.toString()}`;
};

export const getMultipartConfig = (payload) =>
  payload instanceof FormData
    ? {
        // We typically do NOT set Content-Type manually for FormData in Axios/Browser
        // because the browser needs to append the boundary string automatically.
        // Modern Axios handles FormData automatically if we don't override the header.
        headers: {},
      }
    : {};

const normalizeNextUrl = (url) => {
  if (!url) return null;
  if (!url.startsWith('http')) return url;

  try {
    const urlObj = new URL(url);
    // Return only the path + query string.
    // Strip the '/api' prefix if present so Axios baseURL can handle it correctly.
    const path = urlObj.pathname.startsWith('/api') ? urlObj.pathname.substring(4) : urlObj.pathname;

    return `${path}${urlObj.search}`;
  } catch {
    return url;
  }
};

export const fetchAllPages = async (client, url, params = {}) => {
  const items = [];
  let nextUrl = appendQueryParams(url, params);

  while (nextUrl) {
    const response = await client.get(nextUrl);
    const data = unwrapResponse(response);

    items.push(...extractList(response));

    if (Array.isArray(data)) {
      break;
    }

    nextUrl = normalizeNextUrl(data?.next);
  }

  return items;
};

export const fetchOptionalCollection = async (loader, warningMessage, fallbackValue = []) => {
  try {
    return await loader();
  } catch (error) {
    logger.warn(warningMessage, error);
    return fallbackValue;
  }
};
