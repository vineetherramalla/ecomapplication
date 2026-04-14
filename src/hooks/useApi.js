import { useState } from 'react';
import { getNormalizedApiError } from '../api/errorHandler';
import { showToast } from '../utils/helpers';

const shouldToastServerError = (normalizedError) =>
  normalizedError.type === 'server' && (!normalizedError.status || normalizedError.status >= 500);

const useApi = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const clearError = (fieldName) => {
    if (!fieldName) {
      setError(null);
      setFieldErrors({});
      return;
    }

    setFieldErrors((current) => {
      if (!current[fieldName]) {
        return current;
      }

      return {
        ...current,
        [fieldName]: '',
      };
    });

    setError((current) => {
      if (!current) {
        return current;
      }

      return current.type === 'auth' || current.type === 'validation' ? null : current;
    });
  };

  const run = async (request, runOptions = {}) => {
    setLoading(true);

    if (!runOptions.preserveErrorState) {
      setError(null);
      setFieldErrors({});
    }

    try {
      return await request();
    } catch (requestError) {
      const normalizedError = getNormalizedApiError(requestError, runOptions);
      setError(normalizedError);
      setFieldErrors(normalizedError.fieldErrors || {});

      if ((runOptions.showToast || options.showToast || shouldToastServerError(normalizedError)) && !runOptions.suppressToast) {
        showToast({
          title: runOptions.toastTitle || options.toastTitle || 'Request failed',
          message: normalizedError.message,
          type: 'error',
        });
      }

      if (runOptions.throwError) {
        throw requestError;
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fieldErrors,
    setError,
    setFieldErrors,
    clearError,
    run,
  };
};

export default useApi;
