import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  clientIdParamsSchema,
  createCompanyClientSchema,
  listCompanyClientsQuerySchema,
  updateClientStatusSchema,
  updateCompanyClientSchema
} from "./company-clients.schemas.js";
import {
  createCompanyClient,
  deleteCompanyClient,
  getCompanyClientById,
  listCompanyClients,
  updateCompanyClient,
  updateCompanyClientStatus
} from "./company-clients.service.js";

export const companyClientGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const createCompanyClientController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const body = createCompanyClientSchema.parse(req.body);
  const client = await createCompanyClient(companyId, body);
  return sendSuccess(res, client, "Client created", 201);
});

export const listCompanyClientsController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = listCompanyClientsQuerySchema.parse(req.query);
  const clients = await listCompanyClients(companyId, query);
  return sendSuccess(res, clients, "Clients fetched");
});

export const getCompanyClientController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = clientIdParamsSchema.parse(req.params);
  const client = await getCompanyClientById(companyId, params.id);
  return sendSuccess(res, client, "Client fetched");
});

export const updateCompanyClientController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = clientIdParamsSchema.parse(req.params);
  const body = updateCompanyClientSchema.parse(req.body);
  const client = await updateCompanyClient(companyId, params.id, body);
  return sendSuccess(res, client, "Client updated");
});

export const updateCompanyClientStatusController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = clientIdParamsSchema.parse(req.params);
  const body = updateClientStatusSchema.parse(req.body);
  const client = await updateCompanyClientStatus(companyId, params.id, body.status);
  return sendSuccess(res, client, "Client status updated");
});

export const deleteCompanyClientController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = clientIdParamsSchema.parse(req.params);
  const client = await deleteCompanyClient(companyId, params.id);
  return sendSuccess(res, client, "Client removed");
});
