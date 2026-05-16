import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  createCompanyPaymentSchema,
  listCompanyPaymentsQuerySchema,
  paymentIdParamsSchema,
  updateCompanyPaymentSchema
} from "./company-payments.schemas.js";
import {
  createCompanyPayment,
  deleteCompanyPayment,
  getCompanyPaymentById,
  listCompanyPayments,
  updateCompanyPayment
} from "./company-payments.service.js";

export const companyPaymentGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const createCompanyPaymentController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const body = createCompanyPaymentSchema.parse(req.body);
  const payment = await createCompanyPayment(companyId, body);
  return sendSuccess(res, payment, "Payment created", 201);
});

export const listCompanyPaymentsController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = listCompanyPaymentsQuerySchema.parse(req.query);
  const payments = await listCompanyPayments(companyId, query);
  return sendSuccess(res, payments, "Payments fetched");
});

export const getCompanyPaymentController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = paymentIdParamsSchema.parse(req.params);
  const payment = await getCompanyPaymentById(companyId, params.id);
  return sendSuccess(res, payment, "Payment fetched");
});

export const updateCompanyPaymentController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = paymentIdParamsSchema.parse(req.params);
  const body = updateCompanyPaymentSchema.parse(req.body);
  const payment = await updateCompanyPayment(companyId, params.id, body);
  return sendSuccess(res, payment, "Payment updated");
});

export const deleteCompanyPaymentController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = paymentIdParamsSchema.parse(req.params);
  const payment = await deleteCompanyPayment(companyId, params.id);
  return sendSuccess(res, payment, "Payment removed");
});
