import type { Response } from "express";
import ExcelJS from "exceljs";
import { contentDisposition } from "./export-formatting.js";

export type ExcelColumn<T> = {
  header: string;
  key: string;
  width?: number;
  value: (row: T) => string | number;
};

export async function writeWorkbookResponse<T>(res: Response, options: { filename: string; sheetName: string; rows: T[]; columns: Array<ExcelColumn<T>> }) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", contentDisposition(options.filename));
  res.setHeader("Cache-Control", "private, no-store");

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: true, useSharedStrings: false });
  workbook.creator = "SinFleet ERP";
  const worksheet = workbook.addWorksheet(options.sheetName.slice(0, 31));

  worksheet.columns = options.columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width ?? 18
  }));
  worksheet.getRow(1).font = { bold: true, color: { argb: "FF0F172A" } };
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
  worksheet.getRow(1).commit();

  for (const row of options.rows) {
    worksheet.addRow(Object.fromEntries(options.columns.map((column) => [column.key, column.value(row)]))).commit();
  }

  worksheet.commit();
  await workbook.commit();
}
