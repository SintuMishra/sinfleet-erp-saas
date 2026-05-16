import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { companiesRouter } from "../modules/companies/companies.routes.js";
import { companyRouter } from "../modules/company/company.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/company", companyRouter);
apiRouter.use("/companies", companiesRouter);
