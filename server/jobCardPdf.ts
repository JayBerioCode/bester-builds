import PDFDocument from "pdfkit";
import { format } from "date-fns";
import type { Response } from "express";

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#6d28d9",
  primaryLight: "#ede9fe",
  dark: "#1e1b4b",
  text: "#374151",
  muted: "#6b7280",
  border: "#e5e7eb",
  white: "#ffffff",
  accent: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
};
const PAGE = { margins: { top: 50, bottom: 50, left: 50, right: 50 } };
const W = 595 - PAGE.margins.left - PAGE.margins.right;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface JobCardData {
  jobCard: {
    jobCardNumber: string;
    jobTitle: string;
    poNumber: string;
    status: string;
    printType?: string | null;
    width?: string | number | null;
    height?: string | number | null;
    dimensionUnit?: string | null;
    quantity?: number | null;
    material?: string | null;
    finishing?: string | null;
    instructions?: string | null;
    notes?: string | null;
    fileUrl?: string | null;
    assignedToName?: string | null;
    dueDate?: Date | string | null;
    createdAt: Date | string;
  };
  invoice: {
    invoiceNumber: string;
    total: string | number;
  };
  customer: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  company?: {
    companyName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(val: Date | string | null | undefined): string {
  if (!val) return "—";
  try { return format(new Date(val), "dd MMM yyyy"); } catch { return String(val); }
}

function statusColor(status: string): string {
  switch (status) {
    case "completed": return BRAND.accent;
    case "in_progress": return "#2563eb";
    case "cancelled": return BRAND.danger;
    default: return BRAND.warning;
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function labelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth = 110
) {
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.muted).text(label.toUpperCase(), x, y);
  doc.font("Helvetica").fontSize(10).fillColor(BRAND.text).text(value || "—", x + labelWidth, y, { width: W / 2 - labelWidth - 10 });
}

// ─── Main Generator ───────────────────────────────────────────────────────────
export function generateJobCardPDF(data: JobCardData, res: Response): void {
  const { jobCard, invoice, customer, company } = data;

  const doc = new PDFDocument({
    size: "A4",
    margins: PAGE.margins,
    info: {
      Title: `Job Card ${jobCard.jobCardNumber}`,
      Author: company?.companyName ?? "Bester.Builds",
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="job-card-${jobCard.jobCardNumber}.pdf"`
  );
  doc.pipe(res);

  let y = PAGE.margins.top;

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.rect(PAGE.margins.left - 10, y - 10, W + 20, 70).fill(BRAND.dark);

  // Company name top-left
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(BRAND.white)
    .text(company?.companyName ?? "Bester.Builds", PAGE.margins.left, y + 4);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#a5b4fc")
    .text("Large Format Printing", PAGE.margins.left, y + 26);

  // JOB CARD label top-right
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(BRAND.white)
    .text("JOB CARD", PAGE.margins.left, y + 4, { align: "right", width: W });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#c4b5fd")
    .text(jobCard.jobCardNumber, PAGE.margins.left, y + 30, { align: "right", width: W });

  y += 80;

  // ── Status pill ─────────────────────────────────────────────────────────────
  const pillColor = statusColor(jobCard.status);
  doc.roundedRect(PAGE.margins.left, y, 110, 22, 4).fill(pillColor);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(BRAND.white)
    .text(statusLabel(jobCard.status), PAGE.margins.left + 8, y + 6, { width: 94, align: "center" });

  // Date issued
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(`Issued: ${fmtDate(jobCard.createdAt)}`, PAGE.margins.left + 130, y + 7);

  y += 36;

  // ── Job title ───────────────────────────────────────────────────────────────
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(BRAND.dark)
    .text(jobCard.jobTitle, PAGE.margins.left, y, { width: W });
  y += doc.currentLineHeight(true) + 6;

  // Thin purple rule
  doc.rect(PAGE.margins.left, y, W, 2).fill(BRAND.primary);
  y += 10;

  // ── Two-column info grid ─────────────────────────────────────────────────────
  const col1 = PAGE.margins.left;
  const col2 = PAGE.margins.left + W / 2 + 10;
  const rowH = 22;

  // Column headers
  doc.rect(col1, y, W / 2 - 5, 18).fill(BRAND.primaryLight);
  doc.rect(col2 - 10, y, W / 2 - 5, 18).fill(BRAND.primaryLight);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.primary)
    .text("JOB DETAILS", col1 + 6, y + 4)
    .text("CUSTOMER", col2 - 4, y + 4);
  y += 24;

  // Left column: job details
  const leftRows: [string, string][] = [
    ["PO Number", jobCard.poNumber],
    ["Invoice", invoice.invoiceNumber],
    ["Assigned To", jobCard.assignedToName ?? "Unassigned"],
    ["Due Date", fmtDate(jobCard.dueDate)],
  ];
  leftRows.forEach(([label, value], i) => {
    const rowY = y + i * rowH;
    if (i % 2 === 0) doc.rect(col1, rowY, W / 2 - 5, rowH - 2).fill("#f9fafb");
    labelValue(doc, label, value, col1 + 6, rowY + 5, 80);
  });

  // Right column: customer
  const rightRows: [string, string][] = [
    ["Name", customer.name],
    ["Company", customer.company ?? "—"],
    ["Email", customer.email ?? "—"],
    ["Phone", customer.phone ?? "—"],
  ];
  rightRows.forEach(([label, value], i) => {
    const rowY = y + i * rowH;
    if (i % 2 === 0) doc.rect(col2 - 10, rowY, W / 2 - 5, rowH - 2).fill("#f9fafb");
    labelValue(doc, label, value, col2 - 4, rowY + 5, 70);
  });

  y += leftRows.length * rowH + 16;

  // ── Print Specifications ─────────────────────────────────────────────────────
  doc.rect(col1, y, W, 18).fill(BRAND.primaryLight);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.primary)
    .text("PRINT SPECIFICATIONS", col1 + 6, y + 4);
  y += 24;

  const specRows: [string, string][] = [
    ["Print Type", jobCard.printType ?? "—"],
    ["Dimensions", jobCard.width && jobCard.height
      ? `${jobCard.width} × ${jobCard.height} ${jobCard.dimensionUnit ?? "m"}`
      : "—"],
    ["Quantity", String(jobCard.quantity ?? 1)],
    ["Material", jobCard.material ?? "—"],
    ["Finishing", jobCard.finishing ?? "—"],
  ];

  const halfW = (W - 10) / 2;
  specRows.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? col1 : col2 - 10;
    const rowY = y + Math.floor(i / 2) * rowH;
    if (Math.floor(i / 2) % 2 === 0) doc.rect(col, rowY, halfW, rowH - 2).fill("#f9fafb");
    labelValue(doc, label, value, col + 6, rowY + 5, 80);
  });

  y += Math.ceil(specRows.length / 2) * rowH + 16;

  // ── Instructions ────────────────────────────────────────────────────────────
  if (jobCard.instructions) {
    doc.rect(col1, y, W, 18).fill(BRAND.primaryLight);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.primary)
      .text("PRODUCTION INSTRUCTIONS", col1 + 6, y + 4);
    y += 24;

    doc.rect(col1, y, W, 4).fill(BRAND.primary); // top accent bar
    y += 8;

    doc.font("Helvetica").fontSize(10).fillColor(BRAND.text)
      .text(jobCard.instructions, col1 + 6, y, { width: W - 12 });
    y += doc.heightOfString(jobCard.instructions, { width: W - 12 }) + 16;
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (jobCard.notes) {
    doc.rect(col1, y, W, 18).fill("#fef3c7");
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.warning)
      .text("INTERNAL NOTES", col1 + 6, y + 4);
    y += 24;

    doc.font("Helvetica").fontSize(10).fillColor(BRAND.text)
      .text(jobCard.notes, col1 + 6, y, { width: W - 12 });
    y += doc.heightOfString(jobCard.notes, { width: W - 12 }) + 16;
  }

  // ── Artwork URL ──────────────────────────────────────────────────────────────
  if (jobCard.fileUrl) {
    doc.rect(col1, y, W, 18).fill(BRAND.primaryLight);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.primary)
      .text("ARTWORK FILE", col1 + 6, y + 4);
    y += 24;

    doc.font("Helvetica").fontSize(9).fillColor("#2563eb")
      .text(jobCard.fileUrl, col1 + 6, y, { width: W - 12, link: jobCard.fileUrl });
    y += 20;
  }

  // ── Sign-off section ─────────────────────────────────────────────────────────
  y = Math.max(y, 650); // push to near bottom of page
  doc.rect(col1, y, W, 1).fill(BRAND.border);
  y += 12;

  const sigW = (W - 20) / 3;
  const sigLabels = ["Prepared by", "Checked by", "Approved by"];
  sigLabels.forEach((label, i) => {
    const sx = col1 + i * (sigW + 10);
    doc.font("Helvetica").fontSize(8).fillColor(BRAND.muted).text(label, sx, y);
    doc.rect(sx, y + 16, sigW, 30).stroke(BRAND.border);
    doc.font("Helvetica").fontSize(7).fillColor(BRAND.muted)
      .text("Signature & Date", sx + 4, y + 40);
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text(
      `${company?.companyName ?? "Bester.Builds"} · ${company?.phone ?? ""} · ${company?.email ?? ""}`,
      PAGE.margins.left,
      780,
      { align: "center", width: W }
    );

  doc.end();
}
