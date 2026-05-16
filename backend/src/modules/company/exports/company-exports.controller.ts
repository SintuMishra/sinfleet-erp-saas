import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import {
  clientLedgerQuerySchema,
  driverPerformanceQuerySchema,
  reportClientIdParamsSchema,
  reportTripIdParamsSchema,
  reportsSearchQuerySchema,
  vehicleProfitQuerySchema
} from "../reports/company-reports.schemas.js";
import {
  streamClientLedgerXlsx,
  streamClientStatementPdf,
  streamDriverPerformanceXlsx,
  streamOutstandingXlsx,
  streamTripInvoicePdf,
  streamVehicleProfitXlsx
} from "./company-exports.service.js";

export const companyExportGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const getTripInvoicePdfController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = reportTripIdParamsSchema.parse(req.params);
  await streamTripInvoicePdf(res, companyId, params.tripId, req.user!);
});

export const getClientStatementPdfController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = reportClientIdParamsSchema.parse(req.params);
  await streamClientStatementPdf(res, companyId, params.clientId, req.user!);
});

export const getVehicleProfitXlsxController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = vehicleProfitQuerySchema.parse(req.query);
  await streamVehicleProfitXlsx(res, companyId, query, req.user!);
});

export const getDriverPerformanceXlsxController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = driverPerformanceQuerySchema.parse(req.query);
  await streamDriverPerformanceXlsx(res, companyId, query, req.user!);
});

export const getClientLedgerXlsxController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = clientLedgerQuerySchema.parse(req.query);
  await streamClientLedgerXlsx(res, companyId, query, req.user!);
});

export const getOutstandingXlsxController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = reportsSearchQuerySchema.parse(req.query);
  await streamOutstandingXlsx(res, companyId, query.search, req.user!);
});
