import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  clientLedgerQuerySchema,
  documentExpiryQuerySchema,
  driverPerformanceQuerySchema,
  reportDateRangeQuerySchema,
  reportClientIdParamsSchema,
  reportTripIdParamsSchema,
  reportsSearchQuerySchema,
  vehicleProfitQuerySchema
} from "./company-reports.schemas.js";
import {
  getCompanyClientLedgerReport,
  getCompanyClientSummaryReport,
  getCompanyDashboardReport,
  getCompanyDocumentExpiryReport,
  getCompanyDriverPerformanceReport,
  getCompanyOutstandingReport,
  getCompanyTripProfitReport,
  getCompanyVehicleProfitReport
} from "./company-reports.service.js";

export const companyReportGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const getDashboardReportController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = reportDateRangeQuerySchema.parse(req.query);
  const report = await getCompanyDashboardReport(companyId, query);
  return sendSuccess(res, report, "Dashboard report fetched");
});

export const getVehicleProfitReportController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = vehicleProfitQuerySchema.parse(req.query);
  const report = await getCompanyVehicleProfitReport(companyId, query);
  return sendSuccess(res, report, "Vehicle profit report fetched");
});

export const getDriverPerformanceReportController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = driverPerformanceQuerySchema.parse(req.query);
  const report = await getCompanyDriverPerformanceReport(companyId, query);
  return sendSuccess(res, report, "Driver performance report fetched");
});

export const getClientLedgerReportController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = clientLedgerQuerySchema.parse(req.query);
  const report = await getCompanyClientLedgerReport(companyId, query);
  return sendSuccess(res, report, "Client ledger report fetched");
});

export const getDocumentExpiryReportController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = documentExpiryQuerySchema.parse(req.query);
  const report = await getCompanyDocumentExpiryReport(companyId, query);
  return sendSuccess(res, report, "Document expiry report fetched");
});

export const getOutstandingReportController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = reportsSearchQuerySchema.parse(req.query);
  const report = await getCompanyOutstandingReport(companyId, query.search);
  return sendSuccess(res, report, "Outstanding report fetched");
});

export const getTripProfitReportController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = reportTripIdParamsSchema.parse(req.params);
  const report = await getCompanyTripProfitReport(companyId, params.tripId);
  return sendSuccess(res, report, "Trip profit report fetched");
});

export const getClientSummaryReportController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = reportClientIdParamsSchema.parse(req.params);
  const report = await getCompanyClientSummaryReport(companyId, params.clientId);
  return sendSuccess(res, report, "Client summary report fetched");
});
