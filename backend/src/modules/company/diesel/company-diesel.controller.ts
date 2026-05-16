import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  createCompanyDieselSchema,
  dieselIdParamsSchema,
  listCompanyDieselQuerySchema,
  updateCompanyDieselSchema
} from "./company-diesel.schemas.js";
import {
  createCompanyDiesel,
  deleteCompanyDiesel,
  getCompanyDieselById,
  listCompanyDiesel,
  updateCompanyDiesel
} from "./company-diesel.service.js";

export const companyDieselGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const createCompanyDieselController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const body = createCompanyDieselSchema.parse(req.body);
  const diesel = await createCompanyDiesel(companyId, body);
  return sendSuccess(res, diesel, "Diesel entry created", 201);
});

export const listCompanyDieselController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = listCompanyDieselQuerySchema.parse(req.query);
  const diesel = await listCompanyDiesel(companyId, query);
  return sendSuccess(res, diesel, "Diesel entries fetched");
});

export const getCompanyDieselController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = dieselIdParamsSchema.parse(req.params);
  const diesel = await getCompanyDieselById(companyId, params.id);
  return sendSuccess(res, diesel, "Diesel entry fetched");
});

export const updateCompanyDieselController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = dieselIdParamsSchema.parse(req.params);
  const body = updateCompanyDieselSchema.parse(req.body);
  const diesel = await updateCompanyDiesel(companyId, params.id, body);
  return sendSuccess(res, diesel, "Diesel entry updated");
});

export const deleteCompanyDieselController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = dieselIdParamsSchema.parse(req.params);
  const diesel = await deleteCompanyDiesel(companyId, params.id);
  return sendSuccess(res, diesel, "Diesel entry removed");
});
