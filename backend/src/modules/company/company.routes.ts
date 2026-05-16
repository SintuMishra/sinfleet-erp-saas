import { Router } from "express";
import { companyAuditLogRouter } from "../audit/audit-log.routes.js";
import { companyClientsRouter } from "./clients/company-clients.routes.js";
import { companyDieselRouter } from "./diesel/company-diesel.routes.js";
import { companyDriversRouter } from "./drivers/company-drivers.routes.js";
import { companyExpensesRouter } from "./expenses/company-expenses.routes.js";
import { companyExportsRouter } from "./exports/company-exports.routes.js";
import { companyPaymentsRouter } from "./payments/company-payments.routes.js";
import { companyReportsRouter } from "./reports/company-reports.routes.js";
import { companyTripsRouter } from "./trips/company-trips.routes.js";
import { companyVehiclesRouter } from "./vehicles/company-vehicles.routes.js";

export const companyRouter = Router();

companyRouter.use("/audit-logs", companyAuditLogRouter);
companyRouter.use("/drivers", companyDriversRouter);
companyRouter.use("/clients", companyClientsRouter);
companyRouter.use("/diesel", companyDieselRouter);
companyRouter.use("/expenses", companyExpensesRouter);
companyRouter.use("/exports", companyExportsRouter);
companyRouter.use("/payments", companyPaymentsRouter);
companyRouter.use("/reports", companyReportsRouter);
companyRouter.use("/trips", companyTripsRouter);
companyRouter.use("/vehicles", companyVehiclesRouter);
