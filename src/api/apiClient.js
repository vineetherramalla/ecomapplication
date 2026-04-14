import axios from 'axios';
import { normalizeBaseUrl } from './apiUtils';
import { getNormalizedApiError } from './errorHandler';
import { showToast } from '../utils/helpers';
import { authSessionStorage } from '@/store/auth/authSessionStorage';
import { isAdminUser } from '@/features/auth/utils/access';

const DEFAULT_API_BASE_PATH = '/api';

const resolveApiBaseURL = () => {
  const explicitOrigin =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_PROXY_TARGET ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.API_URL;

  if (explicitOrigin && explicitOrigin !== '/') {
    const normalizedOrigin = normalizeBaseUrl(explicitOrigin);
    if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(normalizedOrigin)) {
      return normalizedOrigin.endsWith('/api') ? normalizedOrigin : `${normalizedOrigin}/api`;
    }
    return normalizedOrigin;
  }

  return DEFAULT_API_BASE_PATH;
};

const rawBaseURL = resolveApiBaseURL();
export const requestTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS || 60000);
export const baseURL = normalizeBaseUrl(rawBaseURL);


export const publicApi = axios.create({
  baseURL,
  timeout: requestTimeout,
});

const api = axios.create({
  baseURL,
  timeout: requestTimeout,
});

let refreshPromise = null;

const REFRESH_SKIP_PATHS = ['/login/', '/token/', '/token/refresh/', '/register/', '/verify-otp/', '/resend-otp/'];

const getLoginRedirectPath = () =>
  window.location.pathname.startsWith('/admin') ? '/admin' : '/login';

const shouldSkipRefresh = (url = '') => REFRESH_SKIP_PATHS.some((path) => url.includes(path));

const refreshSessionToken = async () => {
  const refreshToken = authSessionStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  if (!refreshPromise) {
    refreshPromise = publicApi
      .post('/token/refresh/', { refresh: refreshToken }, { suppressGlobalErrorToast: true })
      .then((response) => {
        const nextToken =
          response?.data?.access_token ||
          response?.data?.access ||
          response?.data?.token;

        if (!nextToken) {
          throw new Error('Refresh token response did not include an access token');
        }

        authSessionStorage.setAccessToken(nextToken, {
          isAdmin: isAdminUser(authSessionStorage.getUser()),
        });
        return nextToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const token = authSessionStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry && !shouldSkipRefresh(originalRequest.url || '')) {
      const refreshToken = authSessionStorage.getRefreshToken();
      if (!refreshToken) {
        handleApiError(error, { requiresAuth: true });
        return Promise.reject(error);
      }

      try {
        originalRequest._retry = true;
        const nextToken = await refreshSessionToken();

        // Prepare headers for retry
        const headers = { ...originalRequest.headers };

        // Remove old content-type to allow axios to re-generate boundary for FormData if needed
        delete headers['Content-Type'];
        delete headers['content-type'];

        // Set new token
        headers.Authorization = `Bearer ${nextToken}`;

        return api({
          ...originalRequest,
          headers
        });
      } catch (refreshError) {
        handleApiError(refreshError, { requiresAuth: true });
        return Promise.reject(refreshError);
      }
    }

    handleApiError(error, { requiresAuth: true });
    return Promise.reject(error);
  },
);

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error, { requiresAuth: false });
    return Promise.reject(error);
  },
);

function handleApiError(error, { requiresAuth }) {
  const normalizedError = getNormalizedApiError(error, {
    fallbackMessage: 'Request failed',
  });
  const status = normalizedError.status;
  const errorData = error.response?.data;
  const url = error.config?.url || '';
  const suppressGlobalToast = Boolean(error.config?.suppressGlobalErrorToast);

  const errorString =
    typeof errorData === 'string' ? errorData : JSON.stringify(errorData || '');
  const isUserNotFoundError =
    errorData?.code === 'user_not_found' ||
    errorString.toLowerCase().includes('user matching query does not exist') ||
    errorString.toLowerCase().includes('user not found');
  const isRefreshFailure = url.includes('/token/refresh/') && status >= 500;

  if (!suppressGlobalToast && status === 429) {
    showToast({
      title: 'Too Many Requests',
      message: normalizedError.message,
      type: 'warning',
    });
    return;
  }

  if ((requiresAuth && status === 401) || isUserNotFoundError || isRefreshFailure) {
    authSessionStorage.clearAuthSession();

    const loginPath = getLoginRedirectPath();
    const alreadyOnLogin =
      window.location.pathname === loginPath || window.location.pathname === `${loginPath}/`;

    if (!alreadyOnLogin) {
      showToast({
        title: 'Session Expired',
        message: isUserNotFoundError
          ? 'Your account was not found. Please log in again.'
          : 'Session expired or invalid. Please log in again.',
        type: 'warning',
      });
      window.location.assign(loginPath);
    }
  }
}

export default api;
