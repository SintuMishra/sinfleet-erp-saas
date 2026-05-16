import { ROLES } from "../../../constants/roles.js";
import { asyncHandler } from "../../../middleware/async-handler.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../../middleware/tenant-context.js";
import { sendSuccess } from "../../../services/api-response.js";
import {
  createCompanyExpenseSchema,
  expenseIdParamsSchema,
  listCompanyExpensesQuerySchema,
  updateCompanyExpenseSchema
} from "./company-expenses.schemas.js";
import {
  createCompanyExpense,
  deleteCompanyExpense,
  getCompanyExpenseById,
  listCompanyExpenses,
  updateCompanyExpense
} from "./company-expenses.service.js";

export const companyExpenseGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const createCompanyExpenseController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const body = createCompanyExpenseSchema.parse(req.body);
  const expense = await createCompanyExpense(companyId, body);
  return sendSuccess(res, expense, "Expense created", 201);
});

export const listCompanyExpensesController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = listCompanyExpensesQuerySchema.parse(req.query);
  const expenses = await listCompanyExpenses(companyId, query);
  return sendSuccess(res, expenses, "Expenses fetched");
});

export const getCompanyExpenseController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = expenseIdParamsSchema.parse(req.params);
  const expense = await getCompanyExpenseById(companyId, params.id);
  return sendSuccess(res, expense, "Expense fetched");
});

export const updateCompanyExpenseController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = expenseIdParamsSchema.parse(req.params);
  const body = updateCompanyExpenseSchema.parse(req.body);
  const expense = await updateCompanyExpense(companyId, params.id, body);
  return sendSuccess(res, expense, "Expense updated");
});

export const deleteCompanyExpenseController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const params = expenseIdParamsSchema.parse(req.params);
  const expense = await deleteCompanyExpense(companyId, params.id);
  return sendSuccess(res, expense, "Expense removed");
});
