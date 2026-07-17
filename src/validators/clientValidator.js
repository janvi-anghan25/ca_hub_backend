import { z } from 'zod';

const addressSchema = z
  .object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional(),
  })
  .optional();

export const createClientSchema = z.object({
  clientName: z.string().min(2, 'Client name is required').max(200),
  firmName: z.string().max(200).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  alternativeMobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number').optional(),
  email: z.string().email('Invalid email').optional(),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number')
    .optional(),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number')
    .optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits').optional(),
  address: addressSchema,
  businessType: z.enum(['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'HUF', 'Other']),
  state: z.string().optional(),
  category: z
    .array(z.enum(['GST', 'ITR', 'Company', 'LLP', 'Partnership', 'Audit', 'Other']))
    .min(1, 'Select at least one service'),
  assignedEmployee: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateClientSchema = createClientSchema.partial();
