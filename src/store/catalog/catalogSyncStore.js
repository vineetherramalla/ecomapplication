export const CATALOG_SYNC_KEY = 'catalog_sync_version';
export const CATALOG_SYNC_EVENT = 'catalog-sync';

export const getCatalogSyncVersion = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(CATALOG_SYNC_KEY) || '';
};

export const touchCatalogSync = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const version = String(Date.now());
  window.localStorage.setItem(CATALOG_SYNC_KEY, version);
  window.dispatchEvent(new CustomEvent(CATALOG_SYNC_EVENT, { detail: version }));
  return version;
};

const catalogSyncStore = {
  CATALOG_SYNC_KEY,
  CATALOG_SYNC_EVENT,
  getCatalogSyncVersion,
  touchCatalogSync,
};

export default catalogSyncStore;
