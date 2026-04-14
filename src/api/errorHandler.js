const GLOBAL_ERROR_KEYS = new Set([
  'detail',
  'error',
  'errors',
  'message',
  'non_field_errors',
  'status',
]);



const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const firstNonEmpty = (values = []) =>
  values.find((value) => typeof value === 'string' && value.trim()) || '';

const normalizeMessageValue = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return firstNonEmpty(value.map(normalizeMessageValue));
  }

  if (isPlainObject(value)) {
    return firstNonEmpty(Object.values(value).map(normalizeMessageValue));
  }

  return typeof value === 'number' ? String(value) : '';
};

const collectFieldErrors = (source, target) => {
  if (!isPlainObject(source)) {
    return target;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (GLOBAL_ERROR_KEYS.has(key)) {
      return;
    }

    const message = normalizeMessageValue(value);
    if (message) {
      target[key] = message;
    }
  });

  return target;
};



export const extractApiFieldErrors = (payload) => {
  if (!payload) {
    return {};
  }

  const fieldErrors = {};

  collectFieldErrors(payload, fieldErrors);

  if (isPlainObject(payload.errors)) {
    collectFieldErrors(payload.errors, fieldErrors);
  }

  return fieldErrors;
};

export const extractApiErrorMessage = (payload, fallbackMessage = 'Request failed') => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (!payload) {
    return fallbackMessage;
  }

  const directMessage = firstNonEmpty([
    normalizeMessageValue(payload.error),
    normalizeMessageValue(payload.message),
    normalizeMessageValue(payload.detail),
    normalizeMessageValue(payload.non_field_errors),
  ]);

  if (directMessage) {
    return directMessage;
  }

  const fieldErrors = extractApiFieldErrors(payload);
  const firstFieldMessage = firstNonEmpty(Object.values(fieldErrors));

  return firstFieldMessage || fallbackMessage;
};

export const normalizeApiError = (error, options = {}) => {
  const status = Number(error?.response?.status || error?.status || 0);
  const data = error?.response?.data ?? error?.data ?? null;
  const fieldErrors = extractApiFieldErrors(data);
  const fallbackMessage = options.fallbackMessage || options.fallback || 'Request failed';
  const statusMessages = options.statusMessages || {};
  const networkMessage =
    options.networkMessage || 'Unable to connect. Please check your internet connection and try again.';
  const preserveServerMessage = Boolean(options.preserveServerMessage);

  let message = extractApiErrorMessage(data, '');

  if (!status && error?.message === 'Network Error') {
    message = networkMessage;
  } else if (statusMessages[status]) {
    message = statusMessages[status];
  } else if (status >= 500 && !preserveServerMessage && !message) {
    message = statusMessages[500] || 'Something went wrong. Try again';
  }

  if (!message) {
    message = error?.message || fallbackMessage || 'Something went wrong. Try again';
  }

  const type =
    status === 400 || status === 422
      ? 'validation'
      : status === 401 || status === 403
        ? 'auth'
        : 'server';

  const normalizedError = {
    message,
    status,
    type,
    fieldErrors,
    data,
  };

  if (error && typeof error === 'object') {
    error.normalizedError = normalizedError;
  }

  return normalizedError;
};

export const getNormalizedApiError = (error, options = {}) =>
  error?.normalizedError && !Object.keys(options).length
    ? error.normalizedError
    : normalizeApiError(error, options);
