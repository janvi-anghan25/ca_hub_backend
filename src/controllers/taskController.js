import taskService from '../services/taskService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user.id, req.user.office);
  successResponse(res, task, 'Task created', 201);
});

export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, category, assignedTo, client, search, page = 1, limit = 50 } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (category) filters.category = category;
  if (assignedTo) filters.assignedTo = assignedTo;
  if (client) filters.client = client;
  if (search) filters.search = search;

  const { data, total } = await taskService.getTasks(req.user.office, filters, Number(page), Number(limit));
  paginatedResponse(res, data, total, page, limit, 'Tasks fetched');
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  successResponse(res, task, 'Task fetched');
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  successResponse(res, task, 'Task updated');
});

export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const task = await taskService.addComment(req.params.id, req.user.id, text);
  successResponse(res, task, 'Comment added');
});

export const toggleSubtask = asyncHandler(async (req, res) => {
  const task = await taskService.toggleSubtask(req.params.id, req.params.subtaskId);
  successResponse(res, task, 'Subtask status toggled');
});

export const getTodaysTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTodaysTasks(req.user.office);
  successResponse(res, tasks, "Today's tasks fetched");
});

export const getOverdueTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getOverdueTasks(req.user.office);
  successResponse(res, tasks, 'Overdue tasks fetched');
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id);
  successResponse(res, null, 'Task deleted');
});
