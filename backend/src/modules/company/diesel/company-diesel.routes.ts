import { Router } from "express";
import {
  companyDieselGuards,
  createCompanyDieselController,
  deleteCompanyDieselController,
  getCompanyDieselController,
  listCompanyDieselController,
  updateCompanyDieselController
} from "./company-diesel.controller.js";

export const companyDieselRouter = Router();

companyDieselRouter.post("/", ...companyDieselGuards, createCompanyDieselController);
companyDieselRouter.get("/", ...companyDieselGuards, listCompanyDieselController);
companyDieselRouter.get("/:id", ...companyDieselGuards, getCompanyDieselController);
companyDieselRouter.patch("/:id", ...companyDieselGuards, updateCompanyDieselController);
companyDieselRouter.delete("/:id", ...companyDieselGuards, deleteCompanyDieselController);
