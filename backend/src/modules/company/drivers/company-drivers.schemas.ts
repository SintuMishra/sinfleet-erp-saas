import { z } from "zod";

export const driverStatusSchema = z.enum(["ACTIVE", "ON_TRIP", "INACTIVE", "BLACKLISTED"]);
export const salaryTypeSchema = z.enum(["FIXED", "PER_TRIP", "COMMISSION", "NONE"]);

const phoneSchema = z.string().trim().min(6).max(20);

export const createCompanyDriverSchema = z.object({
  name: z.string().trim().min(2),
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  licenseNumber: z.string().trim().min(3).max(64).transform((value) => value.toUpperCase()),
  licenseExpiryDate: z.coerce.date(),
  aadhaarNumber: z.string().trim().min(4).max(32).optional(),
  address: z.string().trim().max(500).optional(),
  joiningDate: z.coerce.date(),
  salaryType: salaryTypeSchema.default("NONE"),
  salaryAmount: z.coerce.number().nonnegative().optional(),
  status: driverStatusSchema.default("ACTIVE"),
  notes: z.string().trim().max(1000).optional()
});

export const updateCompanyDriverSchema = createCompanyDriverSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

export const updateDriverStatusSchema = z.object({
  status: driverStatusSchema
});

export const listCompanyDriversQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: driverStatusSchema.optional()
});

export const driverIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type CreateCompanyDriverInput = z.infer<typeof createCompanyDriverSchema>;
export type UpdateCompanyDriverInput = z.infer<typeof updateCompanyDriverSchema>;
export type ListCompanyDriversQuery = z.infer<typeof listCompanyDriversQuerySchema>;
