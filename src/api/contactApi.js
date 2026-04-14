import { publicApi } from './axiosInstance';
import { unwrapResponse } from './apiUtils';

const contactPath = import.meta.env.VITE_CONTACT_API_PATH || '/contact/';

export const submitContactMessage = async (payload) => {
  try {
    const response = await publicApi.post(contactPath, payload);
    return unwrapResponse(response);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(
        `Contact endpoint not found at ${contactPath}. Set VITE_CONTACT_API_PATH if your backend uses a different route.`,
      );
    }

    throw error;
  }
};
