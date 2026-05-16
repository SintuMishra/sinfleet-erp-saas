import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  createAdminCompanySchema,
  companyIdParamsSchema,
  listAdminCompaniesQuerySchema,
  updateAdminCompanySchema,
  updateCompanyStatusSchema
} from "./admin-companies.schemas.js";
import {
  createAdminCompany,
  getAdminCompanyById,
  listAdminCompanies,
  updateAdminCompany,
  updateAdminCompanyStatus
} from "./admin-companies.service.js";

export const superAdminGuards = [requireAuth, requireRole(ROLES.SUPER_ADMIN)];

export const createAdminCompanyController = asyncHandler(async (req, res) => {
  const body = createAdminCompanySchema.parse(req.body);
  const company = await createAdminCompany(body);
  return sendSuccess(res, company, "Company created", 201);
});

export const listAdminCompaniesController = asyncHandler(async (req, res) => {
  const query = listAdminCompaniesQuerySchema.parse(req.query);
  const companies = await listAdminCompanies(query);
  return sendSuccess(res, companies, "Companies fetched");
});

export const getAdminCompanyController = asyncHandler(async (req, res) => {
  const params = companyIdParamsSchema.parse(req.params);
  const company = await getAdminCompanyById(params.id);
  return sendSuccess(res, company, "Company fetched");
});

export const updateAdminCompanyController = asyncHandler(async (req, res) => {
  const params = companyIdParamsSchema.parse(req.params);
  const body = updateAdminCompanySchema.parse(req.body);
  const company = await updateAdminCompany(params.id, body);
  return sendSuccess(res, company, "Company updated");
});

export const updateAdminCompanyStatusController = asyncHandler(async (req, res) => {
  const params = companyIdParamsSchema.parse(req.params);
  const body = updateCompanyStatusSchema.parse(req.body);
  const company = await updateAdminCompanyStatus(params.id, body.status);
  return sendSuccess(res, company, "Company status updated");
});
