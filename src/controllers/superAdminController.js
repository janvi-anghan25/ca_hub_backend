import superAdminService from '../services/superAdminService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

// ─── Global Stats ─────────────────────────────────────────────────────────────
export const getGlobalStats = asyncHandler(async (req, res) => {
  const stats = await superAdminService.getGlobalStats();
  successResponse(res, stats, 'Global stats fetched');
});

// ─── Offices ──────────────────────────────────────────────────────────────────
export const getAllOffices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const { data, total } = await superAdminService.getAllOffices({
    page: Number(page),
    limit: Number(limit),
    search,
  });
  paginatedResponse(res, data, total, page, limit, 'Offices fetched');
});

export const getOfficeById = asyncHandler(async (req, res) => {
  const office = await superAdminService.getOfficeById(req.params.id);
  successResponse(res, office, 'Office fetched');
});

export const updateOffice = asyncHandler(async (req, res) => {
  const office = await superAdminService.updateOffice(req.params.id, req.body);
  successResponse(res, office, 'Office updated');
});

export const toggleOfficeStatus = asyncHandler(async (req, res) => {
  const office = await superAdminService.toggleOfficeStatus(req.params.id);
  successResponse(res, office, `Office ${office.isActive ? 'activated' : 'deactivated'} successfully`);
});

// ─── Admins ───────────────────────────────────────────────────────────────────
export const getAllAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const { data, total } = await superAdminService.getAllAdmins({
    page: Number(page),
    limit: Number(limit),
    search,
  });
  paginatedResponse(res, data, total, page, limit, 'Admins fetched');
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, mobile, officeName, officeAddress } = req.body;
  const result = await superAdminService.createAdmin({
    name, email, password, mobile, officeName, officeAddress,
  });
  successResponse(res, result, 'Admin and office created successfully', 201);
});

export const toggleAdminStatus = asyncHandler(async (req, res) => {
  const admin = await superAdminService.toggleAdminStatus(req.params.id);
  successResponse(res, admin, `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`);
});
