import itrReturnService from '../services/itrReturnService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const createReturn = asyncHandler(async (req, res) => {
  const itrReturn = await itrReturnService.createReturn(req.body, req.user.id, req.user.office);
  successResponse(res, itrReturn, 'ITR created', 201);
});

export const getReturns = asyncHandler(async (req, res) => {
  const { status, formType, assessmentYear, client, refundStatus, page = 1, limit = 10 } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (formType) filters.formType = formType;
  if (assessmentYear) filters.assessmentYear = assessmentYear;
  if (client) filters.client = client;
  if (refundStatus) filters.refundStatus = refundStatus;

  const { data, total } = await itrReturnService.getReturns(req.user.office, filters, Number(page), Number(limit));
  paginatedResponse(res, data, total, page, limit, 'ITR Records fetched');
});

export const getReturnById = asyncHandler(async (req, res) => {
  const itrReturn = await itrReturnService.getReturnById(req.params.id);
  successResponse(res, itrReturn, 'ITR fetched');
});

export const updateReturn = asyncHandler(async (req, res) => {
  const itrReturn = await itrReturnService.updateReturn(req.params.id, req.body);
  successResponse(res, itrReturn, 'ITR updated');
});

export const deleteReturn = asyncHandler(async (req, res) => {
  await itrReturnService.deleteReturn(req.params.id);
  successResponse(res, null, 'ITR deleted');
});

export const getPendingReturns = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const returns = await itrReturnService.getPendingReturns(req.user.office, Number(days));
  successResponse(res, returns, 'Pending ITR fetched');
});

export const getOverdueReturns = asyncHandler(async (req, res) => {
  const returns = await itrReturnService.getOverdueReturns(req.user.office);
  successResponse(res, returns, 'Overdue ITR fetched');
});

export const getRefundPending = asyncHandler(async (req, res) => {
  const returns = await itrReturnService.getRefundPending(req.user.office);
  successResponse(res, returns, 'Refund pending ITR fetched');
});
