import { z } from "zod";

export const companyStatusSchema = z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "EXPIRED"]);

const dateStringSchema = z.coerce.date();

export const createCompanyAdminUserSchema = z
  .object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(6).optional(),
    temporaryPassword: z.string().min(10)
  })
  .optional();

export const createAdminCompanySchema = z.object({
  companyName: z.string().trim().min(2),
  companyCode: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/i)
    .transform((value) => value.toUpperCase()),
  ownerName: z.string().trim().min(2),
  ownerPhone: z.string().trim().min(6),
  ownerEmail: z.string().trim().email().transform((value) => value.toLowerCase()),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  address: z.string().trim().min(5),
  gstNumber: z.string().trim().max(32).optional(),
  planName: z.string().trim().min(2),
  maxVehicles: z.coerce.number().int().min(1),
  maxUsers: z.coerce.number().int().min(1),
  subscriptionStartDate: dateStringSchema,
  subscriptionEndDate: dateStringSchema,
  status: companyStatusSchema.default("TRIAL"),
  adminUser: createCompanyAdminUserSchema
});

export const updateAdminCompanySchema = createAdminCompanySchema
  .omit({
    companyCode: true,
    adminUser: true
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const updateCompanyStatusSchema = z.object({
  status: companyStatusSchema
});

export const companyIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const listAdminCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: companyStatusSchema.optional()
});

export type CreateAdminCompanyInput = z.infer<typeof createAdminCompanySchema>;
export type UpdateAdminCompanyInput = z.infer<typeof updateAdminCompanySchema>;
export type ListAdminCompaniesQuery = z.infer<typeof listAdminCompaniesQuerySchema>;
