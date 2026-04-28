import api, { publicApi } from './axiosInstance';
import { unwrapResponse } from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

export const registerUser = async (payload) =>
  unwrapResponse(await publicApi.post(API_ENDPOINTS.auth.register, payload));

export const verifyOtp = async (payload) =>
  unwrapResponse(await publicApi.post(API_ENDPOINTS.auth.verifyOtp, payload));

export const resendOtp = async (payload) =>
  unwrapResponse(await publicApi.post(API_ENDPOINTS.auth.resendOtp, payload));

export const loginUser = async (payload) =>
  await publicApi.post(API_ENDPOINTS.auth.login, payload);

export const requestToken = async (payload) =>
  await publicApi.post(API_ENDPOINTS.auth.token, payload);

export const refreshAccessToken = async (refresh) =>
  unwrapResponse(await publicApi.post(API_ENDPOINTS.auth.refresh, { refresh }));

export const requestPasswordReset = async (payload) =>
  unwrapResponse(await publicApi.post(API_ENDPOINTS.auth.resetPassword, payload));

export const confirmPasswordReset = async (payload) =>
  unwrapResponse(await publicApi.post(API_ENDPOINTS.auth.confirmPassword, payload));

export const logoutUser = async (payload) =>
  unwrapResponse(await api.post(API_ENDPOINTS.auth.logout, payload));

export const probeAdminAccess = async (token) =>
  unwrapResponse(
    await publicApi.get(API_ENDPOINTS.analytics.dashboard, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      suppressGlobalErrorToast: true,
    }),
  );
