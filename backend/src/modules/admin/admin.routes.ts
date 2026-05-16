import { Router } from "express";
import { adminAuditLogRouter } from "../audit/audit-log.routes.js";
import { adminCompaniesRouter } from "./companies/admin-companies.routes.js";

export const adminRouter = Router();

adminRouter.use("/audit-logs", adminAuditLogRouter);
adminRouter.use("/companies", adminCompaniesRouter);
