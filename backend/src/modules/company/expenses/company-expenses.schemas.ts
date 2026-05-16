import { z } from "zod";
import { paymentModeSchema } from "../diesel/company-diesel.schemas.js";

export const expenseTypeSchema = z.enum([
  "TOLL",
  "REPAIR",
  "CHALLAN",
  "LOADING",
  "UNLOADING",
  "DRIVER_ADVANCE",
  "HELPER",
  "FOOD",
  "PARKING",
  "TYRE",
  "MAINTENANCE",
  "OTHER"
]);

export const createCompanyExpenseSchema = z.object({
  tripId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  expenseDate: z.coerce.date(),
  expenseType: expenseTypeSchema,
  amount: z.coerce.number().positive(),
  paymentMode: paymentModeSchema,
  paidTo: z.string().trim().max(160).optional(),
  billNumber: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1000).optional(),
  receiptImageUrl: z.string().trim().url().optional()
});

export const updateCompanyExpenseSchema = createCompanyExpenseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

export const listCompanyExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  tripId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  expenseType: expenseTypeSchema.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
});

export const expenseIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type CreateCompanyExpenseInput = z.infer<typeof createCompanyExpenseSchema>;
export type UpdateCompanyExpenseInput = z.infer<typeof updateCompanyExpenseSchema>;
export type ListCompanyExpensesQuery = z.infer<typeof listCompanyExpensesQuerySchema>;
