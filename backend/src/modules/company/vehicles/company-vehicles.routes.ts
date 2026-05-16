import { Router } from "express";
import {
  companyVehicleGuards,
  createCompanyVehicleController,
  deleteCompanyVehicleController,
  getCompanyVehicleController,
  listCompanyVehiclesController,
  updateCompanyVehicleController,
  updateCompanyVehicleStatusController
} from "./company-vehicles.controller.js";

export const companyVehiclesRouter = Router();

companyVehiclesRouter.post("/", ...companyVehicleGuards, createCompanyVehicleController);
companyVehiclesRouter.get("/", ...companyVehicleGuards, listCompanyVehiclesController);
companyVehiclesRouter.get("/:id", ...companyVehicleGuards, getCompanyVehicleController);
companyVehiclesRouter.patch("/:id", ...companyVehicleGuards, updateCompanyVehicleController);
companyVehiclesRouter.patch("/:id/status", ...companyVehicleGuards, updateCompanyVehicleStatusController);
companyVehiclesRouter.delete("/:id", ...companyVehicleGuards, deleteCompanyVehicleController);
