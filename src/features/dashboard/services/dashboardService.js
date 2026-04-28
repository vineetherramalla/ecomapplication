import api from '@/api/axiosInstance';
import { unwrapResponse } from '@/api/apiUtils';
import { API_ENDPOINTS } from '@/api/endpoints';

export const getDashboardData = async () => {
  const response = await api.get(API_ENDPOINTS.analytics.dashboard);
  return unwrapResponse(response);
};

const dashboardService = {
  getDashboardData,
};

export default dashboardService;
