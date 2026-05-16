import { z } from "zod";

export const paymentModeSchema = z.enum(["CASH", "UPI", "CARD", "CREDIT", "OTHER"]);

export const createCompanyDieselSchema = z.object({
  tripId: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  dieselDate: z.coerce.date(),
  fuelStationName: z.string().trim().max(160).optional(),
  liters: z.coerce.number().positive(),
  ratePerLiter: z.coerce.number().positive(),
  paymentMode: paymentModeSchema,
  billNumber: z.string().trim().max(80).optional(),
  odometerReading: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().trim().max(1000).optional(),
  receiptImageUrl: z.string().trim().url().optional()
});

export const updateCompanyDieselSchema = createCompanyDieselSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

export const listCompanyDieselQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  tripId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
});

export const dieselIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type CreateCompanyDieselInput = z.infer<typeof createCompanyDieselSchema>;
export type UpdateCompanyDieselInput = z.infer<typeof updateCompanyDieselSchema>;
export type ListCompanyDieselQuery = z.infer<typeof listCompanyDieselQuerySchema>;
