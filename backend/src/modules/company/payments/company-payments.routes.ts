import { Router } from "express";
import {
  companyPaymentGuards,
  createCompanyPaymentController,
  deleteCompanyPaymentController,
  getCompanyPaymentController,
  listCompanyPaymentsController,
  updateCompanyPaymentController
} from "./company-payments.controller.js";

export const companyPaymentsRouter = Router();

companyPaymentsRouter.post("/", ...companyPaymentGuards, createCompanyPaymentController);
companyPaymentsRouter.get("/", ...companyPaymentGuards, listCompanyPaymentsController);
companyPaymentsRouter.get("/:id", ...companyPaymentGuards, getCompanyPaymentController);
companyPaymentsRouter.patch("/:id", ...companyPaymentGuards, updateCompanyPaymentController);
companyPaymentsRouter.delete("/:id", ...companyPaymentGuards, deleteCompanyPaymentController);
