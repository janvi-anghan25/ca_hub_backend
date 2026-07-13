import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  rate: z.number().nonnegative('Rate must be non-negative'),
  amount: z.number().nonnegative().optional(),
  sacCode: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  client: z.string().min(1, 'Client is required'),
  invoiceDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item required'),
  discountType: z.enum(['Percentage', 'Fixed']).optional(),
  discountValue: z.number().nonnegative().optional(),
  gstRate: z.number().nonnegative().optional(),
  isIGST: z.boolean().optional(),
  notes: z.string().max(500).optional(),
  terms: z.string().max(500).optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']).optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().or(z.date()),
  paymentMode: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'NEFT', 'RTGS', 'Other']),
  transactionId: z.string().optional(),
  bankName: z.string().optional(),
  chequeNumber: z.string().optional(),
  notes: z.string().optional(),
});
