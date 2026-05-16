import { Router } from "express";
import { companyGuards, createCompanyController, listCompaniesController } from "./companies.controller.js";

export const companiesRouter = Router();

companiesRouter.get("/", ...companyGuards, listCompaniesController);
companiesRouter.post("/", ...companyGuards, createCompanyController);
