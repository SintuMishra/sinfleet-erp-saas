import { Router } from "express";
import {
  adminAuditLogGuards,
  companyAuditLogGuards,
  listAdminAuditLogsController,
  listCompanyAuditLogsController
} from "./audit-log.controller.js";

export const adminAuditLogRouter = Router();
export const companyAuditLogRouter = Router();

adminAuditLogRouter.get("/", ...adminAuditLogGuards, listAdminAuditLogsController);
companyAuditLogRouter.get("/", ...companyAuditLogGuards, listCompanyAuditLogsController);
