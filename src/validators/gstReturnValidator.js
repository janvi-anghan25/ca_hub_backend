import { z } from 'zod';

export const createGSTReturnSchema = z.object({
  client: z.string().min(1, 'Client is required'),
  returnType: z.enum(['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-9C', 'CMP-08', 'GSTR-2A', 'GSTR-2B', 'Other']),
  period: z.object({
    month: z.number().min(1).max(12).optional(),
    quarter: z.number().min(1).max(4).optional(),
    year: z.number().min(2020).max(2030),
  }),
  dueDate: z.string().or(z.date()),
  filedDate: z.string().or(z.date()).optional(),
  status: z.enum(['Pending', 'Data Received', 'In Progress', 'Filed', 'Late Filed']).optional(),
  acknowledgementNumber: z.string().optional(),
  taxableAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  lateFee: z.number().min(0).optional(),
  interest: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  assignedTo: z.string().optional(),
});

export const updateGSTReturnSchema = createGSTReturnSchema.partial();
