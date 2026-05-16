import { z } from "zod";

export const tripStatusSchema = z.enum(["BOOKED", "LOADING", "IN_TRANSIT", "DELIVERED", "CANCELLED", "BILLED", "PAID"]);
export const quantityUnitSchema = z.enum(["TON", "KG", "CFT", "BAG", "PIECE", "OTHER"]);
export const rateTypeSchema = z.enum(["FIXED", "PER_TON", "PER_KM", "PER_CFT", "OTHER"]);

export const createCompanyTripSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  clientId: z.string().uuid(),
  sourceLocation: z.string().trim().min(2),
  destinationLocation: z.string().trim().min(2),
  loadingDate: z.coerce.date(),
  unloadingDate: z.coerce.date().optional(),
  materialName: z.string().trim().max(120).optional(),
  quantity: z.coerce.number().positive().optional(),
  quantityUnit: quantityUnitSchema.default("TON"),
  freightAmount: z.coerce.number().nonnegative(),
  advanceAmount: z.coerce.number().nonnegative().default(0),
  rateType: rateTypeSchema.default("FIXED"),
  distanceKm: z.coerce.number().nonnegative().optional(),
  status: tripStatusSchema.default("BOOKED"),
  notes: z.string().trim().max(1000).optional()
});

export const updateCompanyTripSchema = createCompanyTripSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

export const updateTripStatusSchema = z.object({
  status: tripStatusSchema
});

export const listCompanyTripsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: tripStatusSchema.optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
});

export const tripIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type CreateCompanyTripInput = z.infer<typeof createCompanyTripSchema>;
export type UpdateCompanyTripInput = z.infer<typeof updateCompanyTripSchema>;
export type ListCompanyTripsQuery = z.infer<typeof listCompanyTripsQuerySchema>;
