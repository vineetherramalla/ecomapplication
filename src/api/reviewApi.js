import api, { publicApi } from './axiosInstance';
import { extractList, unwrapResponse } from './apiUtils';
import { API_ENDPOINTS } from './endpoints';

export const normalizeReview = (review) => {
  if (!review) {
    return null;
  }

  const authorSource = review.user || review.customer || review.author || {};

  return {
    ...review,
    id: review.id ?? review.pk ?? review.review_id,
    product: review.product?.id ?? review.product_id ?? review.product,
    rating: Math.max(1, Math.min(5, Number(review.rating ?? review.stars ?? 0) || 0)),
    title: review.title || review.summary || '',
    comment: review.comment || review.review || review.description || '',
    user: authorSource,
    userId: authorSource?.id ?? review.user_id ?? review.customer_id ?? review.author_id,
    userName:
      authorSource?.name ||
      authorSource?.full_name ||
      authorSource?.username ||
      authorSource?.email ||
      review.user_name ||
      review.customer_name ||
      'Verified customer',
    createdAt: review.created_at || review.createdAt || review.date || null,
    updatedAt: review.updated_at || review.updatedAt || null,
  };
};

export const normalizeReviews = (payload) => {
  const data = unwrapResponse(payload);
  if (!data) return [];
  
  // Handle various response formats including single objects
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.results)) {
    list = data.results;
  } else if (Array.isArray(data.items)) {
    list = data.items;
  } else if (data.id || data.pk || data.review_id) {
    // Single object fallback
    list = [data];
  }

  return list.map(normalizeReview).filter(Boolean);
};

export const getProductReviews = async (productId) => {
  try {
    // Standard DRF filtering uses query parameters
    const response = await publicApi.get(API_ENDPOINTS.reviews.reviews, {
      params: { product: productId, product_id: productId },
    });
    const reviews = normalizeReviews(response);
    
    // If we got reviews, return them
    if (reviews.length > 0) {
      return reviews;
    }
    
    // If empty, try the path-based approach as a fallback just in case
    const pathResponse = await publicApi.get(API_ENDPOINTS.reviews.productReviews(productId));
    return normalizeReviews(pathResponse);
  } catch {
    // Final fallback to the path-based approach if the first one errors out
    return normalizeReviews(await publicApi.get(API_ENDPOINTS.reviews.productReviews(productId)));
  }
};

export const getReviews = async (params = {}) =>
  normalizeReviews(await publicApi.get(API_ENDPOINTS.reviews.reviews, { params }));

export const getReviewById = async (reviewId) =>
  normalizeReview(unwrapResponse(await publicApi.get(API_ENDPOINTS.reviews.detail(reviewId))));

export const createReview = async (payload) =>
  normalizeReview(unwrapResponse(await api.post(API_ENDPOINTS.reviews.reviews, payload)));

export const updateReview = async (reviewId, payload) =>
  normalizeReview(unwrapResponse(await api.put(API_ENDPOINTS.reviews.detail(reviewId), payload)));

export const deleteReview = async (reviewId) =>
  unwrapResponse(await api.delete(API_ENDPOINTS.reviews.detail(reviewId)));

export const reviewApi = {
  getProductReviews,
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};

export default reviewApi;
