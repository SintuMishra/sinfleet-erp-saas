import { Router } from "express";
import {
  createAdminCompanyController,
  getAdminCompanyController,
  listAdminCompaniesController,
  superAdminGuards,
  updateAdminCompanyController,
  updateAdminCompanyStatusController
} from "./admin-companies.controller.js";

export const adminCompaniesRouter = Router();

adminCompaniesRouter.post("/", ...superAdminGuards, createAdminCompanyController);
adminCompaniesRouter.get("/", ...superAdminGuards, listAdminCompaniesController);
adminCompaniesRouter.get("/:id", ...superAdminGuards, getAdminCompanyController);
adminCompaniesRouter.patch("/:id", ...superAdminGuards, updateAdminCompanyController);
adminCompaniesRouter.patch("/:id/status", ...superAdminGuards, updateAdminCompanyStatusController);
