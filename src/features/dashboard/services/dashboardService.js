import api from '@/api/axiosInstance';
import { unwrapResponse } from '@/api/apiUtils';

export const getDashboardData = async () => {
  const response = await api.get('/dashboard/');
  return unwrapResponse(response);
};

const dashboardService = {
  getDashboardData,
};

export default dashboardService;
