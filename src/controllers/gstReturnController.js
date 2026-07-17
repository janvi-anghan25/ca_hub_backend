import gstReturnService from '../services/gstReturnService.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const createReturn = asyncHandler(async (req, res) => {
  const gstReturn = await gstReturnService.createReturn(req.body, req.user.id, req.user.office);
  successResponse(res, gstReturn, 'GST Return created', 201);
});

export const importReturns = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded. Attach a .xlsx or .csv file.', 400, 'NO_FILE');
  const summary = await gstReturnService.importReturns(req.file.buffer, req.user.id, req.user.office);
  successResponse(res, summary, 'GST import processed', 200);
});

export const getReturns = asyncHandler(async (req, res) => {
  const { status, returnType, client, page = 1, limit = 10 } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (returnType) filters.returnType = returnType;
  if (client) filters.client = client;

  const { data, total } = await gstReturnService.getReturns(req.user.office, filters, Number(page), Number(limit));
  paginatedResponse(res, data, total, page, limit, 'GST Returns fetched');
});

export const getReturnById = asyncHandler(async (req, res) => {
  const gstReturn = await gstReturnService.getReturnById(req.params.id);
  successResponse(res, gstReturn, 'GST Return fetched');
});

export const updateReturn = asyncHandler(async (req, res) => {
  const gstReturn = await gstReturnService.updateReturn(req.params.id, req.body);
  successResponse(res, gstReturn, 'GST Return updated');
});

export const deleteReturn = asyncHandler(async (req, res) => {
  await gstReturnService.deleteReturn(req.params.id);
  successResponse(res, null, 'GST Return deleted');
});

export const getPendingReturns = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const returns = await gstReturnService.getPendingReturns(req.user.office, Number(days));
  successResponse(res, returns, 'Pending GST Returns fetched');
});

export const getOverdueReturns = asyncHandler(async (req, res) => {
  const returns = await gstReturnService.getOverdueReturns(req.user.office);
  successResponse(res, returns, 'Overdue GST Returns fetched');
});

export const getMonthlyStats = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  const stats = await gstReturnService.getMonthlyStats(req.user.office, Number(year));
  successResponse(res, stats, 'GST Monthly stats fetched');
});
