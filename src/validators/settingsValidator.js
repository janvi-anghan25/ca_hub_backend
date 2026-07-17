import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')
    .optional()
    .or(z.literal('')),
});

export const updateOfficeSchema = z.object({
  name: z.string().min(2, 'Office name is required').max(200).trim().optional(),
  mobile: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gstNumber: z.string().max(15).toUpperCase().optional().or(z.literal('')),
  panNumber: z.string().max(10).toUpperCase().optional().or(z.literal('')),
  invoicePrefix: z.string().max(10).trim().optional(),
  financialYearStart: z.number().int().min(1).max(12).optional(),
  address: z
    .object({
      line1: z.string().max(200).optional().or(z.literal('')),
      city: z.string().max(100).optional().or(z.literal('')),
      state: z.string().max(100).optional().or(z.literal('')),
      pincode: z.string().max(10).optional().or(z.literal('')),
    })
    .optional(),
});
