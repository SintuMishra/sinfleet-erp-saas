import { z } from "zod";

export const createCompanySchema = z.object({
  companyName: z.string().min(2),
  companyCode: z.string().min(2),
  ownerName: z.string().min(2),
  ownerPhone: z.string().min(6),
  ownerEmail: z.string().email(),
  city: z.string().min(2),
  state: z.string().min(2),
  address: z.string().min(5),
  planName: z.string().min(2),
  maxVehicles: z.coerce.number().int().min(1),
  maxUsers: z.coerce.number().int().min(1),
  subscriptionStartDate: z.coerce.date(),
  subscriptionEndDate: z.coerce.date(),
  legalName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional()
});
