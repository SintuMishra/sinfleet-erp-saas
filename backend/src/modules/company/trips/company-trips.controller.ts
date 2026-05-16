import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  createCompanyTripSchema,
  listCompanyTripsQuerySchema,
  tripIdParamsSchema,
  updateCompanyTripSchema,
  updateTripStatusSchema
} from "./company-trips.schemas.js";
import {
  createCompanyTrip,
  deleteCompanyTrip,
  getCompanyTripById,
  listCompanyTrips,
  updateCompanyTrip,
  updateCompanyTripStatus
} from "./company-trips.service.js";

export const companyTripGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const createCompanyTripController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const body = createCompanyTripSchema.parse(req.body);
  const trip = await createCompanyTrip(companyId, body);
  return sendSuccess(res, trip, "Trip created", 201);
});

export const listCompanyTripsController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = listCompanyTripsQuerySchema.parse(req.query);
  const trips = await listCompanyTrips(companyId, query);
  return sendSuccess(res, trips, "Trips fetched");
});

export const getCompanyTripController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = tripIdParamsSchema.parse(req.params);
  const trip = await getCompanyTripById(companyId, params.id);
  return sendSuccess(res, trip, "Trip fetched");
});

export const updateCompanyTripController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = tripIdParamsSchema.parse(req.params);
  const body = updateCompanyTripSchema.parse(req.body);
  const trip = await updateCompanyTrip(companyId, params.id, body);
  return sendSuccess(res, trip, "Trip updated");
});

export const updateCompanyTripStatusController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = tripIdParamsSchema.parse(req.params);
  const body = updateTripStatusSchema.parse(req.body);
  const trip = await updateCompanyTripStatus(companyId, params.id, body.status);
  return sendSuccess(res, trip, "Trip status updated");
});

export const deleteCompanyTripController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = tripIdParamsSchema.parse(req.params);
  const trip = await deleteCompanyTrip(companyId, params.id);
  return sendSuccess(res, trip, "Trip removed");
});
