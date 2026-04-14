import {
  createPriceRequest,
  deletePriceRequest,
  getPriceRequestById,
  getPriceRequests,
  updatePriceRequest,
  updatePriceRequestStatus,
} from '@/api/priceRequestApi';
import { getProductSummaries } from '@/api/productApi';

export const getRequests = getPriceRequests;
export const createRequest = createPriceRequest;
export const getRequestById = getPriceRequestById;
export const updateRequest = updatePriceRequest;
export const getProducts = getProductSummaries;

export const quoteRFQ = async (id, price) =>
  updateRequest(id, {
    status: 'quote_sent',
    quoted_price: price,
  });

export const rejectRFQ = async (id) => updatePriceRequestStatus(id, 'closed');

export const deleteRequest = deletePriceRequest;

export const rfqService = {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  quoteRFQ,
  rejectRFQ,
  deleteRequest,
  getAllRFQs: getRequests,
  updateRFQ: updateRequest,
  getProducts,
};

export default rfqService;
