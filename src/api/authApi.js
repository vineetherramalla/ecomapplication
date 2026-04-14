import api, { publicApi } from './axiosInstance';
import { unwrapResponse } from './apiUtils';

export const registerUser = async (payload) =>
  unwrapResponse(await publicApi.post('/register/', payload));

export const verifyOtp = async (payload) =>
  unwrapResponse(await publicApi.post('/verify-otp/', payload));

export const resendOtp = async (payload) =>
  unwrapResponse(await publicApi.post('/resend-otp/', payload));

export const loginUser = async (payload) =>
  await publicApi.post('/login/', payload);

export const requestToken = async (payload) =>
  await publicApi.post('/token/', payload);

export const refreshAccessToken = async (refresh) =>
  unwrapResponse(await publicApi.post('/token/refresh/', { refresh }));

export const requestPasswordReset = async (payload) =>
  unwrapResponse(await publicApi.post('/reset-password/', payload));

export const confirmPasswordReset = async (payload) =>
  unwrapResponse(await publicApi.post('/confirm-password/', payload));

export const logoutUser = async (payload) =>
  unwrapResponse(await api.post('/logout/', payload));

export const probeAdminAccess = async (token) =>
  unwrapResponse(
    await publicApi.get('/dashboard/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      suppressGlobalErrorToast: true,
    }),
  );
