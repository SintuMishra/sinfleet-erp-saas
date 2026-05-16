import type { Response } from "express";
import PDFDocument from "pdfkit";
import { contentDisposition, formatCurrency, formatDate, safeText } from "./export-formatting.js";

type CompanyExportBrand = {
  companyName: string;
  companyCode: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  gstNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};

export type PdfTableColumn<T> = {
  header: string;
  width: number;
  value: (row: T) => string | number;
  align?: "left" | "right";
};

export function beginPdfResponse(res: Response, filename: string) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", contentDisposition(filename));
  res.setHeader("Cache-Control", "private, no-store");
}

export function createPdfDocument(res: Response) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: false });
  doc.pipe(res);
  return doc;
}

export function addPdfHeader(doc: PDFKit.PDFDocument, company: CompanyExportBrand, title: string, subtitle?: string) {
  doc.fillColor("#0f172a").fontSize(18).text(company.companyName, { continued: false });
  doc.fillColor("#475569").fontSize(9).text([company.address, company.city, company.state].filter(Boolean).join(", "));
  doc.text(`Code: ${company.companyCode}${company.gstNumber ? ` | GST: ${company.gstNumber}` : ""}`);
  doc.text([company.ownerPhone, company.ownerEmail].filter(Boolean).join(" | "));
  doc.moveDown(1);
  doc.fillColor("#0369a1").fontSize(16).text(title);
  if (subtitle) doc.fillColor("#475569").fontSize(10).text(subtitle);
  doc.moveDown(1);
  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(1);
}

export function addKeyValueGrid(doc: PDFKit.PDFDocument, rows: Array<[string, string | number | null | undefined]>) {
  const startX = 40;
  const labelWidth = 115;
  const valueWidth = 160;

  rows.forEach(([label, value], index) => {
    const col = index % 2;
    const x = startX + col * 260;
    if (col === 0 && index > 0) doc.moveDown(0.45);
    const y = doc.y;
    doc.fillColor("#64748b").fontSize(8).text(label, x, y, { width: labelWidth });
    doc.fillColor("#0f172a").fontSize(10).text(safeText(value), x + labelWidth, y, { width: valueWidth });
    if (col === 0 && index + 1 < rows.length) doc.y = y;
  });

  doc.moveDown(1.5);
}

export function addTotals(doc: PDFKit.PDFDocument, rows: Array<[string, string | number]>) {
  doc.moveDown(0.5);
  const boxTop = doc.y;
  doc.roundedRect(335, boxTop, 220, rows.length * 22 + 16, 6).strokeColor("#cbd5e1").stroke();
  rows.forEach(([label, value], index) => {
    const y = boxTop + 10 + index * 22;
    doc.fillColor("#64748b").fontSize(9).text(label, 350, y, { width: 95 });
    doc.fillColor("#0f172a").fontSize(10).text(String(value), 445, y, { width: 95, align: "right" });
  });
  doc.y = boxTop + rows.length * 22 + 24;
}

export function addPdfTable<T>(doc: PDFKit.PDFDocument, columns: Array<PdfTableColumn<T>>, rows: T[]) {
  const tableLeft = 40;
  const rowHeight = 22;

  if (doc.y > 700) doc.addPage();
  let y = doc.y;
  doc.rect(tableLeft, y, columns.reduce((total, column) => total + column.width, 0), rowHeight).fill("#e0f2fe");
  let x = tableLeft;
  columns.forEach((column) => {
    doc.fillColor("#0f172a").fontSize(8).text(column.header, x + 5, y + 7, { width: column.width - 10, align: column.align ?? "left" });
    x += column.width;
  });
  y += rowHeight;

  rows.forEach((row, index) => {
    if (y > 745) {
      doc.addPage();
      y = 40;
    }
    doc.rect(tableLeft, y, columns.reduce((total, column) => total + column.width, 0), rowHeight).fill(index % 2 === 0 ? "#ffffff" : "#f8fafc");
    x = tableLeft;
    columns.forEach((column) => {
      doc.fillColor("#0f172a").fontSize(8).text(String(column.value(row)), x + 5, y + 7, { width: column.width - 10, align: column.align ?? "left" });
      x += column.width;
    });
    y += rowHeight;
  });
  doc.y = y + 10;
}

export const pdfFormat = { currency: formatCurrency, date: formatDate };
