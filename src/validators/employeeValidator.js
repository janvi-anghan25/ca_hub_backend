import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  email: z.string().email('Valid email is required for login credentials').toLowerCase(),
  designation: z.string().max(100).trim().optional().or(z.literal('')),
  department: z.string().max(100).trim().optional().or(z.literal('')),
  joiningDate: z.union([z.string(), z.date()]).optional().nullable(),
  salary: z.coerce.number().nonnegative().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number').optional(),
  designation: z.string().max(100).trim().optional().or(z.literal('')),
  department: z.string().max(100).trim().optional().or(z.literal('')),
  joiningDate: z.string().optional(),
  salary: z.coerce.number().nonnegative().optional(),
});
