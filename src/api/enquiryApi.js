import { publicApi } from '@/api/axiosInstance';
import { unwrapResponse } from '@/api/apiUtils';
import { API_ENDPOINTS } from '@/api/endpoints';

const ENQUIRY_PATH = API_ENDPOINTS.orders.enquiries;

export const submitEnquiry = async (payload) => {
  const response = await publicApi.post(ENQUIRY_PATH, payload);
  return unwrapResponse(response);
};

export const enquiryService = {
  submitEnquiry,
};

export default enquiryService;
