import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  module: z.string().optional(),
  action: z.string().optional(),
  companyId: z.string().uuid().optional()
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
