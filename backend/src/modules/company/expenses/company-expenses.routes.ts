import { Router } from "express";
import {
  companyExpenseGuards,
  createCompanyExpenseController,
  deleteCompanyExpenseController,
  getCompanyExpenseController,
  listCompanyExpensesController,
  updateCompanyExpenseController
} from "./company-expenses.controller.js";

export const companyExpensesRouter = Router();

companyExpensesRouter.post("/", ...companyExpenseGuards, createCompanyExpenseController);
companyExpensesRouter.get("/", ...companyExpenseGuards, listCompanyExpensesController);
companyExpensesRouter.get("/:id", ...companyExpenseGuards, getCompanyExpenseController);
companyExpensesRouter.patch("/:id", ...companyExpenseGuards, updateCompanyExpenseController);
companyExpensesRouter.delete("/:id", ...companyExpenseGuards, deleteCompanyExpenseController);
