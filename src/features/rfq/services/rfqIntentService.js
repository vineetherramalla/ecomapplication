import logger from '@/utils/logger';

const RFQ_INTENT_KEY = 'pending_rfq_intent';
const canUseSessionStorage =
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

export const rfqIntentService = {
  save(intent) {
    if (!canUseSessionStorage || !intent?.productId || !intent?.path) {
      return;
    }

    try {
      window.sessionStorage.setItem(RFQ_INTENT_KEY, JSON.stringify(intent));
    } catch (error) {
      logger.warn('Unable to persist RFQ intent to sessionStorage.', error);
    }
  },

  get() {
    if (!canUseSessionStorage) {
      return null;
    }

    try {
      const value = window.sessionStorage.getItem(RFQ_INTENT_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.warn('Unable to read RFQ intent from sessionStorage. Clearing corrupted value.', error);
      window.sessionStorage.removeItem(RFQ_INTENT_KEY);
      return null;
    }
  },

  clear() {
    if (!canUseSessionStorage) {
      return;
    }

    window.sessionStorage.removeItem(RFQ_INTENT_KEY);
  },
};

export default rfqIntentService;
