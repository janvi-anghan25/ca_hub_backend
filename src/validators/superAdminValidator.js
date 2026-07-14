import { z } from 'zod';

export const createAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase and a number'),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid mobile number')
    .optional()
    .or(z.literal('')),
  officeName: z.string().min(2, 'Office name must be at least 2 characters').max(200).trim(),
  officeAddress: z
    .object({
      line1: z.string().max(200).trim().optional(),
      city: z.string().max(100).trim().optional(),
      state: z.string().max(100).trim().optional(),
      pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional().or(z.literal('')),
    })
    .optional(),
});

export const updateOfficeSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  address: z
    .object({
      line1: z.string().max(200).trim().optional(),
      city: z.string().max(100).trim().optional(),
      state: z.string().max(100).trim().optional(),
      pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
    })
    .optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number').optional().or(z.literal('')),
  email: z.string().email().toLowerCase().optional(),
  gstNumber: z.string().max(15).optional().or(z.literal('')),
  panNumber: z.string().max(10).optional().or(z.literal('')),
});
