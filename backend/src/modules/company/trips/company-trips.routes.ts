import { Router } from "express";
import {
  companyTripGuards,
  createCompanyTripController,
  deleteCompanyTripController,
  getCompanyTripController,
  listCompanyTripsController,
  updateCompanyTripController,
  updateCompanyTripStatusController
} from "./company-trips.controller.js";

export const companyTripsRouter = Router();

companyTripsRouter.post("/", ...companyTripGuards, createCompanyTripController);
companyTripsRouter.get("/", ...companyTripGuards, listCompanyTripsController);
companyTripsRouter.get("/:id", ...companyTripGuards, getCompanyTripController);
companyTripsRouter.patch("/:id", ...companyTripGuards, updateCompanyTripController);
companyTripsRouter.patch("/:id/status", ...companyTripGuards, updateCompanyTripStatusController);
companyTripsRouter.delete("/:id", ...companyTripGuards, deleteCompanyTripController);
