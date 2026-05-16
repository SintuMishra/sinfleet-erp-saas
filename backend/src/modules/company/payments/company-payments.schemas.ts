import { z } from "zod";

export const companyPaymentModeSchema = z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE", "CREDIT", "OTHER"]);

export const createCompanyPaymentSchema = z.object({
  clientId: z.string().uuid(),
  tripId: z.string().uuid().optional(),
  paymentDate: z.coerce.date(),
  amount: z.coerce.number().positive(),
  paymentMode: companyPaymentModeSchema,
  referenceNumber: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  receiptImageUrl: z.string().trim().url().optional()
});

export const updateCompanyPaymentSchema = createCompanyPaymentSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

export const listCompanyPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  clientId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  paymentMode: companyPaymentModeSchema.optional()
});

export const paymentIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type CreateCompanyPaymentInput = z.infer<typeof createCompanyPaymentSchema>;
export type UpdateCompanyPaymentInput = z.infer<typeof updateCompanyPaymentSchema>;
export type ListCompanyPaymentsQuery = z.infer<typeof listCompanyPaymentsQuerySchema>;
