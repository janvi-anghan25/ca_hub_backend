import invoiceService from '../services/invoiceService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body, req.user.id, req.user.office);
  successResponse(res, invoice, 'Invoice created', 201);
});

export const getInvoices = asyncHandler(async (req, res) => {
  const { paymentStatus, client, startDate, endDate, page = 1, limit = 10 } = req.query;
  const filters = {};
  if (paymentStatus) filters.paymentStatus = paymentStatus;
  if (client) filters.client = client;
  if (startDate && endDate) {
    filters.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const { data, total } = await invoiceService.getInvoices(req.user.office, filters, Number(page), Number(limit));
  paginatedResponse(res, data, total, page, limit, 'Invoices fetched');
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  successResponse(res, invoice, 'Invoice fetched');
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
  successResponse(res, invoice, 'Invoice updated');
});

export const recordPayment = asyncHandler(async (req, res) => {
  const payment = await invoiceService.recordPayment(req.params.id, req.body, req.user.id, req.user.office);
  successResponse(res, payment, 'Payment recorded', 201);
});

export const getPayments = asyncHandler(async (req, res) => {
  const { paymentMode, client, page = 1, limit = 15 } = req.query;
  const filters = {};
  if (paymentMode) filters.paymentMode = paymentMode;
  if (client) filters.client = client;

  const { data, total } = await invoiceService.getPayments(
    req.user.office,
    filters,
    Number(page),
    Number(limit)
  );
  paginatedResponse(res, data, total, page, limit, 'Payments fetched');
});

export const getRevenueStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();
  const stats = await invoiceService.getRevenueStats(req.user.office, start, end);
  successResponse(res, stats, 'Revenue stats fetched');
});

export const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  const data = await invoiceService.getMonthlyRevenue(req.user.office, Number(year));
  successResponse(res, data, 'Monthly revenue fetched');
});

export const getOverdueInvoices = asyncHandler(async (req, res) => {
  const invoices = await invoiceService.getOverdueInvoices(req.user.office);
  successResponse(res, invoices, 'Overdue invoices fetched');
});
