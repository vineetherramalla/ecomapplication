import { publicApi } from '@/api/axiosInstance';
import { unwrapResponse } from '@/api/apiUtils';

const ENQUIRY_PATH = '/enquiries/';

export const submitEnquiry = async (payload) => {
  const response = await publicApi.post(ENQUIRY_PATH, payload);
  return unwrapResponse(response);
};

export const enquiryService = {
  submitEnquiry,
};

export default enquiryService;
