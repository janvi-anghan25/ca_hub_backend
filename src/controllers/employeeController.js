import employeeService from '../services/employeeService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const createEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.createEmployee(req.body, req.user);
  successResponse(
    res,
    result,
    'Employee created. Login ID and temporary password have been sent to their email.',
    201
  );
});

export const getEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { data, total } = await employeeService.getEmployees(
    req.user.office,
    Number(page),
    Number(limit)
  );
  paginatedResponse(res, data, total, page, limit, 'Employees fetched');
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  successResponse(res, employee, 'Employee fetched');
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  successResponse(res, employee, 'Employee updated');
});

export const assignClient = asyncHandler(async (req, res) => {
  const employee = await employeeService.assignClient(req.params.id, req.body.clientId);
  successResponse(res, employee, 'Client assigned to employee');
});

export const markAttendance = asyncHandler(async (req, res) => {
  const employee = await employeeService.markAttendance(req.params.id, req.body);
  successResponse(res, employee, 'Attendance marked');
});

export const applyLeave = asyncHandler(async (req, res) => {
  const employee = await employeeService.applyLeave(req.params.id, req.body);
  successResponse(res, employee, 'Leave applied');
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.deleteEmployee(req.params.id);
  successResponse(res, null, 'Employee deactivated');
});
