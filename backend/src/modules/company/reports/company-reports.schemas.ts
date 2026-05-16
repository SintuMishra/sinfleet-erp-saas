import { z } from "zod";

export const reportDateRangeQuerySchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
});

export const vehicleProfitQuerySchema = reportDateRangeQuerySchema.extend({
  vehicleId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const driverPerformanceQuerySchema = reportDateRangeQuerySchema.extend({
  driverId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const clientLedgerQuerySchema = reportDateRangeQuerySchema.extend({
  clientId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const documentExpiryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const reportsSearchQuerySchema = z.object({
  search: z.string().trim().optional()
});

export type ReportDateRangeQuery = z.infer<typeof reportDateRangeQuerySchema>;
export type VehicleProfitQuery = z.infer<typeof vehicleProfitQuerySchema>;
export type DriverPerformanceQuery = z.infer<typeof driverPerformanceQuerySchema>;
export type ClientLedgerQuery = z.infer<typeof clientLedgerQuerySchema>;
export type DocumentExpiryQuery = z.infer<typeof documentExpiryQuerySchema>;

export const reportTripIdParamsSchema = z.object({
  tripId: z.string().uuid()
});

export const reportClientIdParamsSchema = z.object({
  clientId: z.string().uuid()
});
