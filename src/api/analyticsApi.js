import api from './axiosInstance';
import { unwrapResponse } from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

const getAnalytics = async (url) => unwrapResponse(await api.get(url));

export const getAnalyticsDashboard = () => getAnalytics(API_ENDPOINTS.analytics.dashboard);
export const getSalesAnalytics = () => getAnalytics(API_ENDPOINTS.analytics.sales);
export const getCustomerAnalytics = () => getAnalytics(API_ENDPOINTS.analytics.customers);
export const getReviewAnalytics = () => getAnalytics(API_ENDPOINTS.analytics.reviews);
export const getWishlistAnalytics = () => getAnalytics(API_ENDPOINTS.analytics.wishlists);
export const getInventoryAnalytics = () => getAnalytics(API_ENDPOINTS.analytics.inventory);
export const getComprehensiveAnalytics = () => getAnalytics(API_ENDPOINTS.analytics.comprehensive);

export const analyticsApi = {
  getAnalyticsDashboard,
  getSalesAnalytics,
  getCustomerAnalytics,
  getReviewAnalytics,
  getWishlistAnalytics,
  getInventoryAnalytics,
  getComprehensiveAnalytics,
};

export default analyticsApi;
