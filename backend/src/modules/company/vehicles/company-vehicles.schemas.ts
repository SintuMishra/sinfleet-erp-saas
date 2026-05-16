import { z } from "zod";

export const vehicleTypeSchema = z.enum([
  "TRUCK_10_WHEEL",
  "TRUCK_12_WHEEL",
  "TRUCK_14_WHEEL",
  "TRAILER",
  "SIGNATURE_SIGNA",
  "OTHER"
]);

export const fuelTypeSchema = z.enum(["DIESEL", "CNG", "PETROL", "ELECTRIC", "OTHER"]);
export const ownershipTypeSchema = z.enum(["OWNED", "ATTACHED", "RENTED"]);
export const vehicleStatusSchema = z.enum(["ACTIVE", "IDLE", "ON_TRIP", "MAINTENANCE", "INACTIVE"]);

const vehicleNumberSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .transform((value) => value.toUpperCase().replace(/\s+/g, ""));

const expiryDateSchema = z.coerce.date();

export const createCompanyVehicleSchema = z.object({
  vehicleNumber: vehicleNumberSchema,
  vehicleType: vehicleTypeSchema,
  make: z.string().trim().min(2),
  model: z.string().trim().min(1),
  manufacturingYear: z.coerce.number().int().min(1980).max(2100),
  fuelType: fuelTypeSchema,
  ownershipType: ownershipTypeSchema,
  capacityTon: z.coerce.number().positive(),
  status: vehicleStatusSchema.default("ACTIVE"),
  rcNumber: z.string().trim().min(3),
  insuranceExpiryDate: expiryDateSchema,
  fitnessExpiryDate: expiryDateSchema,
  permitExpiryDate: expiryDateSchema,
  pollutionExpiryDate: expiryDateSchema,
  gpsDeviceId: z.string().trim().max(64).optional(),
  notes: z.string().trim().max(1000).optional()
});

export const updateCompanyVehicleSchema = createCompanyVehicleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field is required"
  }
);

export const updateVehicleStatusSchema = z.object({
  status: vehicleStatusSchema
});

export const listCompanyVehiclesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: vehicleStatusSchema.optional(),
  vehicleType: vehicleTypeSchema.optional()
});

export const vehicleIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type CreateCompanyVehicleInput = z.infer<typeof createCompanyVehicleSchema>;
export type UpdateCompanyVehicleInput = z.infer<typeof updateCompanyVehicleSchema>;
export type ListCompanyVehiclesQuery = z.infer<typeof listCompanyVehiclesQuerySchema>;
