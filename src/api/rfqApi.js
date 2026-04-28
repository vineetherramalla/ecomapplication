import * as priceRequestApi from './priceRequestApi';

const rfqService = {
  getRequests: priceRequestApi.getPriceRequests,
  getRequestById: priceRequestApi.getPriceRequestById,
  createRequest: priceRequestApi.createPriceRequest,
  updateRequest: priceRequestApi.updatePriceRequest,
  updateStatus: priceRequestApi.updatePriceRequestStatus,
  deleteRequest: priceRequestApi.deletePriceRequest,
};

export default rfqService;
