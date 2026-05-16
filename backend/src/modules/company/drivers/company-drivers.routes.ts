import { Router } from "express";
import {
  companyDriverGuards,
  createCompanyDriverController,
  deleteCompanyDriverController,
  getCompanyDriverController,
  listCompanyDriversController,
  updateCompanyDriverController,
  updateCompanyDriverStatusController
} from "./company-drivers.controller.js";

export const companyDriversRouter = Router();

companyDriversRouter.post("/", ...companyDriverGuards, createCompanyDriverController);
companyDriversRouter.get("/", ...companyDriverGuards, listCompanyDriversController);
companyDriversRouter.get("/:id", ...companyDriverGuards, getCompanyDriverController);
companyDriversRouter.patch("/:id", ...companyDriverGuards, updateCompanyDriverController);
companyDriversRouter.patch("/:id/status", ...companyDriverGuards, updateCompanyDriverStatusController);
companyDriversRouter.delete("/:id", ...companyDriverGuards, deleteCompanyDriverController);
