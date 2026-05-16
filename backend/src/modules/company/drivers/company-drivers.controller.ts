import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  createCompanyDriverSchema,
  driverIdParamsSchema,
  listCompanyDriversQuerySchema,
  updateCompanyDriverSchema,
  updateDriverStatusSchema
} from "./company-drivers.schemas.js";
import {
  createCompanyDriver,
  deleteCompanyDriver,
  getCompanyDriverById,
  listCompanyDrivers,
  updateCompanyDriver,
  updateCompanyDriverStatus
} from "./company-drivers.service.js";

export const companyDriverGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const createCompanyDriverController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const body = createCompanyDriverSchema.parse(req.body);
  const driver = await createCompanyDriver(companyId, body);
  return sendSuccess(res, driver, "Driver created", 201);
});

export const listCompanyDriversController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = listCompanyDriversQuerySchema.parse(req.query);
  const drivers = await listCompanyDrivers(companyId, query);
  return sendSuccess(res, drivers, "Drivers fetched");
});

export const getCompanyDriverController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = driverIdParamsSchema.parse(req.params);
  const driver = await getCompanyDriverById(companyId, params.id);
  return sendSuccess(res, driver, "Driver fetched");
});

export const updateCompanyDriverController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = driverIdParamsSchema.parse(req.params);
  const body = updateCompanyDriverSchema.parse(req.body);
  const driver = await updateCompanyDriver(companyId, params.id, body);
  return sendSuccess(res, driver, "Driver updated");
});

export const updateCompanyDriverStatusController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = driverIdParamsSchema.parse(req.params);
  const body = updateDriverStatusSchema.parse(req.body);
  const driver = await updateCompanyDriverStatus(companyId, params.id, body.status);
  return sendSuccess(res, driver, "Driver status updated");
});

export const deleteCompanyDriverController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = driverIdParamsSchema.parse(req.params);
  const driver = await deleteCompanyDriver(companyId, params.id);
  return sendSuccess(res, driver, "Driver removed");
});
