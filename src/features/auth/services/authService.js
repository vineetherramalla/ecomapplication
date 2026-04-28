import { extractAuthData } from '@/api/apiUtils';
import {
  confirmPasswordReset,
  loginUser,
  logoutUser,
  probeAdminAccess,
  refreshAccessToken,
  registerUser,
  resendOtp,
  requestPasswordReset,
  requestToken,
  verifyOtp,
} from '@/api/authApi';
import { authSessionStorage } from '@/store/auth/authSessionStorage';
import { getAuthUserSource, isAdminUser, resolveUserRole } from '@/features/auth/utils/access';
import logger from '@/utils/logger';

const buildUserProfile = (payload, credentials) => {
  const source = getAuthUserSource(payload);
  const role = resolveUserRole(source, payload);

  return {
    ...source,
    groups: Array.isArray(source.groups) ? source.groups : Array.isArray(payload.groups) ? payload.groups : [],
    is_staff:
      source.is_staff ??
      source.isStaff ??
      payload.is_staff ??
      payload.isStaff ??
      source.is_admin ??
      source.isAdmin ??
      payload.is_admin ??
      payload.isAdmin ??
      false,
    is_superuser:
      source.is_superuser ??
      source.isSuperuser ??
      payload.is_superuser ??
      payload.isSuperuser ??
      false,
    name:
      source.name ||
      source.full_name ||
      source.fullname ||
      source.username ||
      source.email ||
      credentials.username ||
      credentials.email ||
      'User',
    role,
    username: source.username || credentials.username || source.email || credentials.email || '',
    email: source.email || credentials.email || credentials.username || '',
  };
};

const normalizeCredentialValue = (value) =>
  typeof value === 'string' ? value.trim() : '';

const normalizeLoginCredentials = (credentials = {}) => {
  const username = normalizeCredentialValue(credentials.username);
  const email = normalizeCredentialValue(credentials.email) || (username.includes('@') ? username : '');

  return {
    ...credentials,
    username: username || email || undefined,
    email: email || undefined,
    password: credentials.password ?? '',
  };
};

const buildUserFromToken = (token) => {
  if (!token) {
    return null;
  }

  const tokenPayload = extractAuthData({ access_token: token });
  const source = getAuthUserSource(tokenPayload);

  if (!source || !Object.keys(source).length) {
    return null;
  }

  return buildUserProfile(tokenPayload, {});
};

const getTokenPayload = (token) => {
  if (!token) {
    return null;
  }

  const authData = extractAuthData({ access_token: token });
  return authData?.admin && typeof authData.admin === 'object' ? authData.admin : null;
};

const isTokenExpired = (token, skewMs = 15_000) => {
  const payload = getTokenPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return Number(payload.exp) * 1000 <= Date.now() + skewMs;
};

const mergeSessionUser = (storedUser, tokenUser) => {
  if (!storedUser) {
    return tokenUser;
  }

  if (!tokenUser) {
    return storedUser;
  }

  return {
    ...storedUser,
    ...tokenUser,
    name: storedUser.name || tokenUser.name || 'User',
    username: storedUser.username || tokenUser.username || storedUser.email || tokenUser.email || '',
    email: storedUser.email || tokenUser.email || storedUser.username || tokenUser.username || '',
    company_name: storedUser.company_name || tokenUser.company_name || '',
    phone: storedUser.phone || tokenUser.phone || '',
    groups: Array.isArray(tokenUser.groups)
      ? tokenUser.groups
      : Array.isArray(storedUser.groups)
        ? storedUser.groups
        : [],
    role: resolveUserRole(tokenUser, storedUser),
    is_staff: tokenUser.is_staff ?? tokenUser.isStaff ?? false,
    is_superuser: tokenUser.is_superuser ?? tokenUser.isSuperuser ?? false,
    is_admin: tokenUser.is_admin ?? tokenUser.isAdmin ?? false,
  };
};

const createAuthError = (message, payload = null) => {
  const error = new Error(message);
  error.name = 'AuthenticationError';

  if (payload && typeof payload === 'object') {
    error.response = {
      status: 401,
      data: payload,
    };
  }

  return error;
};

export const authService = {
  login: async (credentials) => {
    try {
      const normalizedCredentials = normalizeLoginCredentials(credentials);
      let loginData = {};
      let token = '';
      let refreshToken = '';
      let mergedData = {};

      authSessionStorage.clearAuthSession();

      try {
        loginData = extractAuthData(await loginUser(normalizedCredentials));
        token = loginData.access_token || loginData.token || loginData.access;
        refreshToken = loginData.refresh_token || loginData.refresh;
        mergedData = loginData;
      } catch (error) {
        const status = Number(error?.response?.status || 0);
        if (![404, 405].includes(status)) {
          throw error;
        }
      }

      if (!token) {
        const tokenData = extractAuthData(await requestToken(normalizedCredentials));
        token = tokenData.access_token || tokenData.token || tokenData.access;
        refreshToken = tokenData.refresh_token || tokenData.refresh || refreshToken;
        mergedData = {
          ...loginData,
          ...tokenData,
          admin: loginData.admin || tokenData.admin,
          user: loginData.user || tokenData.user,
        };
      }

      const user = buildUserProfile(mergedData, normalizedCredentials);

      if (!token) {
        throw createAuthError('Authentication succeeded but no access token was returned.', mergedData);
      }

      authSessionStorage.setSession(token, user, refreshToken);
      return { token, user, refreshToken };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const fullName = String(userData.fullname || userData.full_name || userData.name || '').trim();
      const [firstName, ...restName] = fullName.split(/\s+/).filter(Boolean);

      const payload = {
        username: userData.username || userData.email,
        first_name: userData.first_name || firstName || '',
        last_name: userData.last_name || restName.join(' '),
        fullname: fullName,
        company_name: userData.company_name,
        company_address: userData.company_address,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
      };


      const response = await registerUser(payload);
      authSessionStorage.setTempEmail(userData.email);
      authSessionStorage.setTempRegistration(payload);
      return response;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  },

  verifyOTP: async (data) => {
    try {
      const payload =
        typeof data === 'string'
          ? { email: authSessionStorage.getTempEmail(), otp: data }
          : data;
      return await verifyOtp(payload);
    } catch (error) {
      logger.error('OTP Verification error:', error);
      throw error;
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await requestPasswordReset({ email });
      authSessionStorage.clearTempPasswordReset();
      authSessionStorage.setTempEmail(email);
      return response;
    } catch (error) {
      logger.error('Reset password request error:', error);
      throw error;
    }
  },

  confirmPassword: async (data) => {
    try {
      const payload = {
        email: data.email,
        otp: data.otp,
        new_password: data.password || data.new_password,
      };
      return await confirmPasswordReset(payload);
    } catch (error) {
      logger.error('Confirm password error:', error);
      throw error;
    }
  },

  clearSession: () => authSessionStorage.clearSession(),

  verifyAdminAccess: async (token = authSessionStorage.getToken()) => {
    if (!token) {
      return null;
    }

    try {
      const response = await probeAdminAccess(token);
      const user = getAuthUserSource(response);

      if (isAdminUser(user, response)) {
        authSessionStorage.setUser(user);
        return user;
      }
      return null;
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 401 || status === 403) {
        return null;
      }
      throw error;
    }
  },

  logout: async (redirectTo = '/login') => {
    const refresh = authSessionStorage.getRefreshToken();

    try {
      await logoutUser(refresh ? { refresh } : undefined).catch(() => {});
    } finally {
      authSessionStorage.clearSession();
      window.location.assign(redirectTo);
    }
  },

  refreshToken: async () => {
    try {
      const refresh = authSessionStorage.getRefreshToken();
      if (!refresh) {
        throw new Error('No refresh token');
      }

      const response = await refreshAccessToken(refresh);
      const access = response?.access || response?.token || response?.access_token;
      if (access) {
        authSessionStorage.setAccessToken(access, { isAdmin: authService.isAdmin() });
        return access;
      }
    } catch (error) {
      authSessionStorage.clearAuthSession();
      throw error;
    }
  },

  setSession: (token, user, refreshToken = null) =>
    authSessionStorage.setSession(token, user, refreshToken),

  setTempEmail: (email) => authSessionStorage.setTempEmail(email),
  getTempEmail: () => authSessionStorage.getTempEmail(),
  clearTempEmail: () => authSessionStorage.clearTempEmail(),
  setTempRegistration: (payload) => authSessionStorage.setTempRegistration(payload),
  getTempRegistration: () => authSessionStorage.getTempRegistration(),
  clearTempRegistration: () => authSessionStorage.clearTempRegistration(),
  setTempPasswordReset: (payload) => {
    if (!payload?.email || !payload?.otp) {
      return;
    }

    authSessionStorage.setTempPasswordReset({
      email: payload.email,
      otp: payload.otp,
    });
  },
  getTempPasswordReset: () => authSessionStorage.getTempPasswordReset(),
  clearTempPasswordReset: () => authSessionStorage.clearTempPasswordReset(),

  getToken: () => authSessionStorage.getToken(),

  getCurrentUser: () => {
    const storedUser = authSessionStorage.getUser();
    const token = authSessionStorage.getToken();

    if (!token) {
      return storedUser;
    }

    const tokenUser = buildUserFromToken(token);
    const sessionUser = mergeSessionUser(storedUser, tokenUser);

    if (!storedUser && sessionUser) {
      authSessionStorage.setUser(sessionUser);
    }

    return sessionUser;
  },

  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user ? resolveUserRole(user) : null;
  },

  hasValidAccessToken: () => {
    const token = authSessionStorage.getToken();
    return Boolean(token) && !isTokenExpired(token);
  },
  isAuthenticated: () => !!authService.getToken(),
  isAdminUser,
  isAdmin: () => isAdminUser(authService.getCurrentUser()),
  signup: (userData) => authService.register(userData),
  verifyEmailOTP: (data) => authService.verifyOTP(data),
  resendVerificationOTP: async () => {
    const email = authService.getTempEmail();

    if (!email) {
      throw new Error('Registration email not found. Please register again to receive a new OTP.');
    }

    return resendOtp({ email });
  },
  forgotPassword: (email) => authService.requestPasswordReset(email),
  resetPassword: (value) =>
    typeof value === 'string' ? authService.requestPasswordReset(value) : authService.confirmPassword(value),
  createToken: (credentials) => requestToken(credentials),
};

export default authService;
