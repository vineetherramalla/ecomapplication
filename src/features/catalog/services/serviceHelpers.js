import { touchCatalogSync } from '@/store/catalog/catalogSyncStore';
import logger from '@/utils/logger';

export const runServiceAction = async (action, errorMessage) => {
  try {
    return await action();
  } catch (error) {
    logger.error(errorMessage, error);
    throw error;
  }
};

export const runCatalogMutation = async (action, errorMessage, afterSuccess) =>
  runServiceAction(async () => {
    const result = await action();

    if (afterSuccess) {
      await afterSuccess(result);
    }

    touchCatalogSync();
    return result;
  }, errorMessage);
