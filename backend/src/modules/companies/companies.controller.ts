import { ROLES } from "../../constants/roles.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role-guard.js";
import { sendSuccess } from "../../services/api-response.js";
import { createCompanySchema } from "./companies.schemas.js";
import { createCompany, listCompanies } from "./companies.service.js";

export const companyGuards = [requireAuth, requireRole(ROLES.SUPER_ADMIN)];

export const listCompaniesController = asyncHandler(async (_req, res) => {
  const companies = await listCompanies();
  return sendSuccess(res, companies, "Companies fetched");
});

export const createCompanyController = asyncHandler(async (req, res) => {
  const body = createCompanySchema.parse(req.body);
  const company = await createCompany(body);
  return sendSuccess(res, company, "Company created", 201);
});
