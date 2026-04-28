import logger from '@/utils/logger';
import { isAdminUser } from '@/features/auth/utils/access';

const STORAGE_KEYS = {
  token: 'token',
  refreshToken: 'refresh_token',
  user: 'user',
  legacyAdminToken: 'luma_admin_token',
  legacyAdminProfile: 'luma_admin_profile',
  tempEmail: 'temp_auth_email',
  tempRegistration: 'temp_registration_payload',
  tempPasswordReset: 'temp_password_reset_payload',
};

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readStringValue = (...keys) => {
  if (!canUseStorage()) {
    return '';
  }

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return typeof value === 'string' ? value.replace(/^"(.*)"$/, '$1') : value;
    }
  }

  return '';
};

const readObjectValue = (key, label) => {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
      ? parsedValue
      : null;
  } catch (error) {
    logger.warn(`Unable to parse stored ${label}. Clearing corrupted value.`, error);
    window.localStorage.removeItem(key);
    return null;
  }
};

const setObjectValue = (key, value) => {
  if (!canUseStorage()) {
    return;
  }

  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeKeys = (...keys) => {
  if (!canUseStorage()) {
    return;
  }

  keys.forEach((key) => window.localStorage.removeItem(key));
};

export const authSessionStorage = {
  keys: STORAGE_KEYS,
  getToken() {
    return readStringValue(STORAGE_KEYS.token, STORAGE_KEYS.legacyAdminToken);
  },
  setAccessToken(token, { isAdmin = false } = {}) {
    if (!canUseStorage()) {
      return;
    }

    if (!token) {
      removeKeys(STORAGE_KEYS.token, STORAGE_KEYS.legacyAdminToken);
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.token, token);
    if (isAdmin) {
      window.localStorage.setItem(STORAGE_KEYS.legacyAdminToken, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.legacyAdminToken);
    }
  },
  getRefreshToken() {
    return readStringValue(STORAGE_KEYS.refreshToken);
  },
  setRefreshToken(refreshToken) {
    if (!canUseStorage()) {
      return;
    }

    if (!refreshToken) {
      window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  },
  getUser() {
    return (
      readObjectValue(STORAGE_KEYS.user, 'user session') ||
      readObjectValue(STORAGE_KEYS.legacyAdminProfile, 'admin session')
    );
  },
  setUser(user) {
    if (!user) {
      removeKeys(STORAGE_KEYS.user, STORAGE_KEYS.legacyAdminProfile);
      return;
    }

    setObjectValue(STORAGE_KEYS.user, user);

    if (isAdminUser(user)) {
      setObjectValue(STORAGE_KEYS.legacyAdminProfile, user);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.legacyAdminProfile);
    }
  },
  setSession(token, user, refreshToken = null) {
    this.setAccessToken(token, { isAdmin: isAdminUser(user) });
    this.setUser(user);
    this.setRefreshToken(refreshToken);
  },
  clearAuthSession() {
    removeKeys(
      STORAGE_KEYS.token,
      STORAGE_KEYS.refreshToken,
      STORAGE_KEYS.user,
      STORAGE_KEYS.legacyAdminToken,
      STORAGE_KEYS.legacyAdminProfile,
    );
  },
  clearSession() {
    this.clearAuthSession();
    removeKeys(
      STORAGE_KEYS.tempEmail,
      STORAGE_KEYS.tempRegistration,
      STORAGE_KEYS.tempPasswordReset,
    );
  },
  setTempEmail(email) {
    if (!canUseStorage()) {
      return;
    }

    if (!email) {
      window.localStorage.removeItem(STORAGE_KEYS.tempEmail);
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.tempEmail, email);
  },
  getTempEmail() {
    return readStringValue(STORAGE_KEYS.tempEmail);
  },
  clearTempEmail() {
    removeKeys(STORAGE_KEYS.tempEmail);
  },
  setTempRegistration(payload) {
    setObjectValue(STORAGE_KEYS.tempRegistration, payload);
  },
  getTempRegistration() {
    return readObjectValue(STORAGE_KEYS.tempRegistration, 'registration payload');
  },
  clearTempRegistration() {
    removeKeys(STORAGE_KEYS.tempRegistration);
  },
  setTempPasswordReset(payload) {
    setObjectValue(STORAGE_KEYS.tempPasswordReset, payload);
  },
  getTempPasswordReset() {
    return readObjectValue(STORAGE_KEYS.tempPasswordReset, 'password reset payload');
  },
  clearTempPasswordReset() {
    removeKeys(STORAGE_KEYS.tempPasswordReset);
  },
};

export default authSessionStorage;
