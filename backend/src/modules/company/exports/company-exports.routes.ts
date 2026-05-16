import { Router } from "express";
import {
  companyExportGuards,
  getClientLedgerXlsxController,
  getClientStatementPdfController,
  getDriverPerformanceXlsxController,
  getOutstandingXlsxController,
  getTripInvoicePdfController,
  getVehicleProfitXlsxController
} from "./company-exports.controller.js";

export const companyExportsRouter = Router();

companyExportsRouter.get("/trip-invoice/:tripId.pdf", ...companyExportGuards, getTripInvoicePdfController);
companyExportsRouter.get("/client-statement/:clientId.pdf", ...companyExportGuards, getClientStatementPdfController);
companyExportsRouter.get("/vehicle-profit.xlsx", ...companyExportGuards, getVehicleProfitXlsxController);
companyExportsRouter.get("/driver-performance.xlsx", ...companyExportGuards, getDriverPerformanceXlsxController);
companyExportsRouter.get("/client-ledger.xlsx", ...companyExportGuards, getClientLedgerXlsxController);
companyExportsRouter.get("/outstanding.xlsx", ...companyExportGuards, getOutstandingXlsxController);
