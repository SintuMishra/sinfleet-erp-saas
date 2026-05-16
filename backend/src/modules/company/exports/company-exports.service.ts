import type { Response } from "express";
import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../services/app-error.js";
import { createAuditLog, toAuditJson } from "../../../services/audit-log.service.js";
import { formatCurrency, formatDate, formatNumber, safeFilename, safeText } from "../../../services/exports/export-formatting.js";
import { writeWorkbookResponse, type ExcelColumn } from "../../../services/exports/excel.service.js";
import { addKeyValueGrid, addPdfHeader, addPdfTable, addTotals, beginPdfResponse, createPdfDocument, pdfFormat } from "../../../services/exports/pdf.service.js";
import type { AuthenticatedUser } from "../../../types/auth.js";
import type { ClientLedgerQuery, DriverPerformanceQuery, VehicleProfitQuery } from "../reports/company-reports.schemas.js";
import {
  getCompanyClientLedgerReport,
  getCompanyClientSummaryReport,
  getCompanyDriverPerformanceReport,
  getCompanyOutstandingReport,
  getCompanyTripProfitReport,
  getCompanyVehicleProfitReport
} from "../reports/company-reports.service.js";

type ExportUser = Pick<AuthenticatedUser, "id">;

export async function streamTripInvoicePdf(res: Response, companyId: string, tripId: string, user: ExportUser) {
  const [company, tripProfit] = await Promise.all([getCompany(companyId), getCompanyTripProfitReport(companyId, tripId)]);
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, companyId, deletedAt: null },
    select: {
      id: true,
      tripNumber: true,
      sourceLocation: true,
      destinationLocation: true,
      loadingDate: true,
      unloadingDate: true,
      materialName: true,
      quantity: true,
      quantityUnit: true,
      freightAmount: true,
      advanceAmount: true,
      receivedAmount: true,
      balanceAmount: true,
      status: true,
      client: { select: { clientName: true, phone: true, email: true, gstNumber: true, billingAddress: true, city: true, state: true } },
      vehicle: { select: { vehicleNumber: true } },
      driver: { select: { name: true, phone: true } }
    }
  });

  if (!trip) throw new AppError("Trip not found", 404, "TRIP_NOT_FOUND");

  const filename = safeFilename(["trip-invoice", trip.tripNumber, company.companyCode], "pdf");
  await logExport(companyId, user.id, "trip-invoice", trip.id, filename);
  beginPdfResponse(res, filename);

  const doc = createPdfDocument(res);
  addPdfHeader(doc, company, "Trip Invoice", `Invoice for ${trip.tripNumber}`);
  addKeyValueGrid(doc, [
    ["Trip Number", trip.tripNumber],
    ["Status", trip.status],
    ["Client", trip.client.clientName],
    ["Client Phone", trip.client.phone],
    ["Client GST", trip.client.gstNumber],
    ["Vehicle", trip.vehicle.vehicleNumber],
    ["Driver", `${trip.driver.name}${trip.driver.phone ? ` (${trip.driver.phone})` : ""}`],
    ["Loading Date", formatDate(trip.loadingDate)],
    ["Unloading Date", formatDate(trip.unloadingDate)],
    ["Route", `${trip.sourceLocation} to ${trip.destinationLocation}`],
    ["Material", trip.materialName],
    ["Quantity", trip.quantity ? `${formatNumber(trip.quantity)} ${trip.quantityUnit}` : "-"]
  ]);

  doc.fillColor("#0f172a").fontSize(12).text("Freight Summary");
  addPdfTable(
    doc,
    [
      { header: "Description", width: 245, value: () => `${trip.sourceLocation} to ${trip.destinationLocation}` },
      { header: "Freight", width: 90, value: () => formatCurrency(trip.freightAmount), align: "right" },
      { header: "Received", width: 90, value: () => formatCurrency(trip.receivedAmount), align: "right" },
      { header: "Balance", width: 90, value: () => formatCurrency(trip.balanceAmount), align: "right" }
    ],
    [trip]
  );
  addTotals(doc, [
    ["Freight", formatCurrency(tripProfit.freightAmount)],
    ["Advance", formatCurrency(trip.advanceAmount)],
    ["Received", formatCurrency(tripProfit.receivedAmount)],
    ["Balance", formatCurrency(tripProfit.balanceAmount)]
  ]);
  doc.moveDown(0.5).fillColor("#64748b").fontSize(9).text("This invoice is generated from tenant-scoped SinFleet ERP trip records.");
  doc.end();
}

export async function streamClientStatementPdf(res: Response, companyId: string, clientId: string, user: ExportUser) {
  const [company, statement] = await Promise.all([getCompany(companyId), getCompanyClientSummaryReport(companyId, clientId)]);
  const filename = safeFilename(["client-statement", statement.client.clientName, company.companyCode, new Date()], "pdf");
  await logExport(companyId, user.id, "client-statement", clientId, filename);
  beginPdfResponse(res, filename);

  const doc = createPdfDocument(res);
  addPdfHeader(doc, company, "Client Statement", `Statement for ${statement.client.clientName}`);
  addKeyValueGrid(doc, [
    ["Client", statement.client.clientName],
    ["Phone", statement.client.phone],
    ["Email", statement.client.email],
    ["Status", statement.client.status],
    ["Total Trips", statement.summary.tripCount],
    ["Payments", statement.summary.paymentCount]
  ]);
  addTotals(doc, [
    ["Freight", formatCurrency(statement.summary.freightAmount)],
    ["Received", formatCurrency(statement.summary.receivedAmount)],
    ["Payments", formatCurrency(statement.summary.paymentAmount)],
    ["Outstanding", formatCurrency(statement.summary.balanceAmount)]
  ]);
  doc.moveDown(1).fillColor("#0f172a").fontSize(12).text("Outstanding Trips");
  addPdfTable(
    doc,
    [
      { header: "Trip", width: 90, value: (row) => row.tripNumber },
      { header: "Route", width: 185, value: (row) => `${row.sourceLocation} to ${row.destinationLocation}` },
      { header: "Freight", width: 80, value: (row) => pdfFormat.currency(row.freightAmount), align: "right" },
      { header: "Received", width: 80, value: (row) => pdfFormat.currency(row.receivedAmount), align: "right" },
      { header: "Balance", width: 80, value: (row) => pdfFormat.currency(row.balanceAmount), align: "right" }
    ],
    statement.outstandingTrips
  );
  doc.end();
}

export async function streamVehicleProfitXlsx(res: Response, companyId: string, query: VehicleProfitQuery, user: ExportUser) {
  const company = await getCompany(companyId);
  const report = await getCompanyVehicleProfitReport(companyId, { ...query, page: 1, limit: 100 });
  const filename = safeFilename(["vehicle-profit", company.companyCode, query.fromDate ?? "latest"], "xlsx");
  await logExport(companyId, user.id, "vehicle-profit", null, filename);
  await writeWorkbookResponse(res, { filename, sheetName: "Vehicle Profit", rows: report.items, columns: vehicleProfitColumns });
}

export async function streamDriverPerformanceXlsx(res: Response, companyId: string, query: DriverPerformanceQuery, user: ExportUser) {
  const company = await getCompany(companyId);
  const report = await getCompanyDriverPerformanceReport(companyId, { ...query, page: 1, limit: 100 });
  const filename = safeFilename(["driver-performance", company.companyCode, query.fromDate ?? "latest"], "xlsx");
  await logExport(companyId, user.id, "driver-performance", null, filename);
  await writeWorkbookResponse(res, { filename, sheetName: "Driver Performance", rows: report.items, columns: driverPerformanceColumns });
}

export async function streamClientLedgerXlsx(res: Response, companyId: string, query: ClientLedgerQuery, user: ExportUser) {
  const company = await getCompany(companyId);
  const report = await getCompanyClientLedgerReport(companyId, { ...query, page: 1, limit: 100 });
  const filename = safeFilename(["client-ledger", company.companyCode, query.fromDate ?? "latest"], "xlsx");
  await logExport(companyId, user.id, "client-ledger", null, filename);
  await writeWorkbookResponse(res, { filename, sheetName: "Client Ledger", rows: report.items, columns: clientLedgerColumns });
}

export async function streamOutstandingXlsx(res: Response, companyId: string, search: string | undefined, user: ExportUser) {
  const company = await getCompany(companyId);
  const report = await getCompanyOutstandingReport(companyId, search);
  const filename = safeFilename(["outstanding", company.companyCode, new Date()], "xlsx");
  await logExport(companyId, user.id, "outstanding", null, filename);
  await writeWorkbookResponse(res, { filename, sheetName: "Outstanding Trips", rows: report.tripOutstanding, columns: outstandingColumns });
}

async function getCompany(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { companyName: true, companyCode: true, ownerPhone: true, ownerEmail: true, gstNumber: true, address: true, city: true, state: true }
  });

  if (!company) throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
  return company;
}

async function logExport(companyId: string, userId: string | null | undefined, exportType: string, entityId: string | null, filename: string) {
  await createAuditLog({
    companyId,
    userId: userId ?? null,
    module: "exports",
    action: "EXPORT",
    entityId,
    metadata: toAuditJson({ exportType, filename })
  });
}

const vehicleProfitColumns = [
  { header: "Vehicle", key: "vehicleNumber", width: 18, value: (row) => row.vehicleNumber },
  { header: "Trips", key: "totalTrips", width: 10, value: (row) => row.totalTrips },
  { header: "Freight", key: "freightAmount", value: (row) => row.freightAmount },
  { header: "Received", key: "receivedAmount", value: (row) => row.receivedAmount },
  { header: "Pending", key: "pendingAmount", value: (row) => row.pendingAmount },
  { header: "Diesel", key: "dieselAmount", value: (row) => row.dieselAmount },
  { header: "Expense", key: "expenseAmount", value: (row) => row.expenseAmount },
  { header: "Net Profit", key: "netProfit", value: (row) => row.netProfit }
] satisfies Array<ExcelColumn<Awaited<ReturnType<typeof getCompanyVehicleProfitReport>>["items"][number]>>;

const driverPerformanceColumns = [
  { header: "Driver", key: "driverName", width: 22, value: (row) => row.driverName },
  { header: "Trips", key: "totalTrips", width: 10, value: (row) => row.totalTrips },
  { header: "Delivered", key: "deliveredTrips", value: (row) => row.deliveredTrips },
  { header: "Cancelled", key: "cancelledTrips", value: (row) => row.cancelledTrips },
  { header: "Freight", key: "freightAmount", value: (row) => row.freightAmount },
  { header: "Diesel", key: "dieselAmount", value: (row) => row.dieselAmount },
  { header: "Expense", key: "expenseAmount", value: (row) => row.expenseAmount }
] satisfies Array<ExcelColumn<Awaited<ReturnType<typeof getCompanyDriverPerformanceReport>>["items"][number]>>;

const clientLedgerColumns = [
  { header: "Client", key: "clientName", width: 24, value: (row) => row.clientName },
  { header: "Phone", key: "phone", width: 16, value: (row) => safeText(row.phone) },
  { header: "Trips", key: "totalTrips", width: 10, value: (row) => row.totalTrips },
  { header: "Freight", key: "totalFreight", value: (row) => row.totalFreight },
  { header: "Received", key: "totalReceived", value: (row) => row.totalReceived },
  { header: "Payments", key: "paymentAmount", value: (row) => row.paymentAmount },
  { header: "Outstanding", key: "outstanding", value: (row) => row.outstanding }
] satisfies Array<ExcelColumn<Awaited<ReturnType<typeof getCompanyClientLedgerReport>>["items"][number]>>;

const outstandingColumns = [
  { header: "Trip", key: "tripNumber", width: 18, value: (row) => row.tripNumber },
  { header: "Client", key: "clientName", width: 24, value: (row) => row.client.clientName },
  { header: "Vehicle", key: "vehicleNumber", width: 16, value: (row) => row.vehicle.vehicleNumber },
  { header: "Route", key: "route", width: 34, value: (row) => `${row.sourceLocation} to ${row.destinationLocation}` },
  { header: "Loading Date", key: "loadingDate", width: 16, value: (row) => formatDate(row.loadingDate) },
  { header: "Freight", key: "freightAmount", value: (row) => Number(row.freightAmount) },
  { header: "Received", key: "receivedAmount", value: (row) => Number(row.receivedAmount) },
  { header: "Balance", key: "balanceAmount", value: (row) => Number(row.balanceAmount) },
  { header: "Status", key: "status", width: 14, value: (row) => row.status }
] satisfies Array<ExcelColumn<Awaited<ReturnType<typeof getCompanyOutstandingReport>>["tripOutstanding"][number]>>;
