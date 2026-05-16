import { Router } from "express";
import {
  companyReportGuards,
  getClientLedgerReportController,
  getClientSummaryReportController,
  getDashboardReportController,
  getDocumentExpiryReportController,
  getDriverPerformanceReportController,
  getOutstandingReportController,
  getTripProfitReportController,
  getVehicleProfitReportController
} from "./company-reports.controller.js";

export const companyReportsRouter = Router();

companyReportsRouter.get("/dashboard", ...companyReportGuards, getDashboardReportController);
companyReportsRouter.get("/vehicle-profit", ...companyReportGuards, getVehicleProfitReportController);
companyReportsRouter.get("/driver-performance", ...companyReportGuards, getDriverPerformanceReportController);
companyReportsRouter.get("/client-ledger", ...companyReportGuards, getClientLedgerReportController);
companyReportsRouter.get("/document-expiry", ...companyReportGuards, getDocumentExpiryReportController);
companyReportsRouter.get("/outstanding", ...companyReportGuards, getOutstandingReportController);
companyReportsRouter.get("/trip-profit/:tripId", ...companyReportGuards, getTripProfitReportController);
companyReportsRouter.get("/client-summary/:clientId", ...companyReportGuards, getClientSummaryReportController);
