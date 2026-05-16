import { Router } from "express";
import {
  companyClientGuards,
  createCompanyClientController,
  deleteCompanyClientController,
  getCompanyClientController,
  listCompanyClientsController,
  updateCompanyClientController,
  updateCompanyClientStatusController
} from "./company-clients.controller.js";

export const companyClientsRouter = Router();

companyClientsRouter.post("/", ...companyClientGuards, createCompanyClientController);
companyClientsRouter.get("/", ...companyClientGuards, listCompanyClientsController);
companyClientsRouter.get("/:id", ...companyClientGuards, getCompanyClientController);
companyClientsRouter.patch("/:id", ...companyClientGuards, updateCompanyClientController);
companyClientsRouter.patch("/:id/status", ...companyClientGuards, updateCompanyClientStatusController);
companyClientsRouter.delete("/:id", ...companyClientGuards, deleteCompanyClientController);
