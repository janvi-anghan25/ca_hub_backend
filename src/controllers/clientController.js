import clientService from '../services/clientService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.body, req.user.id, req.user.office);
  successResponse(res, client, 'Client created successfully', 201);
});

export const getClients = asyncHandler(async (req, res) => {
  const { q, status, category, assignedEmployee, page = 1, limit = 10 } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (category) filters.category = category;
  if (assignedEmployee) filters.assignedEmployee = assignedEmployee;

  const { data, total } = await clientService.getClients(req.user.office, q, filters, Number(page), Number(limit));
  paginatedResponse(res, data, total, page, limit, 'Clients fetched');
});

export const getClientById = asyncHandler(async (req, res) => {
  const client = await clientService.getClientById(req.params.id);
  successResponse(res, client, 'Client fetched');
});

export const updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.updateClient(req.params.id, req.body);
  successResponse(res, client, 'Client updated');
});

export const deleteClient = asyncHandler(async (req, res) => {
  await clientService.deleteClient(req.params.id);
  successResponse(res, null, 'Client deleted');
});

export const uploadClientPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return successResponse(res, null, 'No file uploaded', 400);
  }
  const photoPath = `/uploads/${req.file.filename}`;
  const client = await clientService.updateClientPhoto(req.params.id, photoPath);
  successResponse(res, client, 'Client photo updated');
});

export const getClientStats = asyncHandler(async (req, res) => {
  const stats = await clientService.getClientStats(req.user.office);
  successResponse(res, stats, 'Client stats fetched');
});
