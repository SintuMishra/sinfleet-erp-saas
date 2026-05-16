import { z } from "zod";

export const clientStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]);

const optionalEmailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase())
  .optional();

const optionalTextSchema = z.string().trim().max(500).optional();

export const createCompanyClientSchema = z.object({
  clientName: z.string().trim().min(2),
  contactPerson: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(6).max(20),
  alternatePhone: z.string().trim().min(6).max(20).optional(),
  email: optionalEmailSchema,
  gstNumber: z.string().trim().min(4).max(32).transform((value) => value.toUpperCase()).optional(),
  billingAddress: optionalTextSchema,
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  paymentTerms: z.string().trim().max(120).optional(),
  status: clientStatusSchema.default("ACTIVE"),
  notes: z.string().trim().max(1000).optional()
});

export const updateCompanyClientSchema = createCompanyClientSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

export const updateClientStatusSchema = z.object({
  status: clientStatusSchema
});

export const listCompanyClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: clientStatusSchema.optional()
});

export const clientIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type CreateCompanyClientInput = z.infer<typeof createCompanyClientSchema>;
export type UpdateCompanyClientInput = z.infer<typeof updateCompanyClientSchema>;
export type ListCompanyClientsQuery = z.infer<typeof listCompanyClientsQuerySchema>;
