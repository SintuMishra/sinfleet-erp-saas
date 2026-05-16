import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  createCompanyVehicleSchema,
  listCompanyVehiclesQuerySchema,
  updateCompanyVehicleSchema,
  updateVehicleStatusSchema,
  vehicleIdParamsSchema
} from "./company-vehicles.schemas.js";
import {
  createCompanyVehicle,
  deleteCompanyVehicle,
  getCompanyVehicleById,
  listCompanyVehicles,
  updateCompanyVehicle,
  updateCompanyVehicleStatus
} from "./company-vehicles.service.js";

export const companyVehicleGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const createCompanyVehicleController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const body = createCompanyVehicleSchema.parse(req.body);
  const vehicle = await createCompanyVehicle(companyId, body);
  return sendSuccess(res, vehicle, "Vehicle created", 201);
});

export const listCompanyVehiclesController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = listCompanyVehiclesQuerySchema.parse(req.query);
  const vehicles = await listCompanyVehicles(companyId, query);
  return sendSuccess(res, vehicles, "Vehicles fetched");
});

export const getCompanyVehicleController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = vehicleIdParamsSchema.parse(req.params);
  const vehicle = await getCompanyVehicleById(companyId, params.id);
  return sendSuccess(res, vehicle, "Vehicle fetched");
});

export const updateCompanyVehicleController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = vehicleIdParamsSchema.parse(req.params);
  const body = updateCompanyVehicleSchema.parse(req.body);
  const vehicle = await updateCompanyVehicle(companyId, params.id, body);
  return sendSuccess(res, vehicle, "Vehicle updated");
});

export const updateCompanyVehicleStatusController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = vehicleIdParamsSchema.parse(req.params);
  const body = updateVehicleStatusSchema.parse(req.body);
  const vehicle = await updateCompanyVehicleStatus(companyId, params.id, body.status);
  return sendSuccess(res, vehicle, "Vehicle status updated");
});

export const deleteCompanyVehicleController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = vehicleIdParamsSchema.parse(req.params);
  const vehicle = await deleteCompanyVehicle(companyId, params.id);
  return sendSuccess(res, vehicle, "Vehicle removed");
});
