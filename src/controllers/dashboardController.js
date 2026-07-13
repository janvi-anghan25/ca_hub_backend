import dashboardService from '../services/dashboardService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getHomeDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getHomeDashboard(req.user.office);
  successResponse(res, data, 'Dashboard data fetched');
});

export const getMonthlyChartData = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  const data = await dashboardService.getMonthlyChartData(req.user.office, Number(year));
  successResponse(res, data, 'Chart data fetched');
});
