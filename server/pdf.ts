import PDFDocument from "pdfkit";
import { format } from "date-fns";
import type { Response } from "express";

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#6d28d9",       // Bester.Builds purple
  primaryLight: "#ede9fe",  // soft purple bg
  dark: "#1e1b4b",          // deep navy for headings
  text: "#374151",          // body text
  muted: "#6b7280",         // secondary text
  border: "#e5e7eb",        // table borders
  white: "#ffffff",
  accent: "#059669",        // green for paid amounts
};

const PAGE = { margins: { top: 50, bottom: 50, left: 50, right: 50 } };
const W = 595 - PAGE.margins.left - PAGE.margins.right; // usable width

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CompanyProfile {
  companyName?: string | null;
  tagline?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  vatNumber?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  branchCode?: string | null;
  website?: string | null;
}

export interface InvoiceData {
  company?: CompanyProfile;
  invoice: {
    invoiceNumber: string;
    status: string;
    issueDate: Date | string;
    dueDate: Date | string;
    subtotal: string | number;
    taxRate: string | number;
    taxAmount: string | number;
    discountAmount: string | number;
    total: string | number;
    amountPaid: string | number;
    amountDue: string | number;
    notes?: string | null;
    terms?: string | null;
  };
  customer: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
  };
  order?: {
    orderNumber: string;
    title: string;
  } | null;
  lineItems: {
    description: string;
    quantity: string | number;
    unitPrice: string | number;
    total: string | number;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function money(val: string | number | null | undefined): string {
  const n = typeof val === "string" ? parseFloat(val) : (val ?? 0);
  return `R ${(n ?? 0).toFixed(2)}`;
}

function fmtDate(val: Date | string | null | undefined): string {
  if (!val) return "—";
  try {
    return format(new Date(val), "dd MMM yyyy");
  } catch {
    return String(val);
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "paid": return BRAND.accent;
    case "overdue": return "#dc2626";
    case "sent":
    case "viewed": return "#2563eb";
    case "partial": return "#d97706";
    default: return BRAND.muted;
  }
}

// ─── Main Generator ───────────────────────────────────────────────────────────
export function generateInvoicePDF(data: InvoiceData, res: Response): void {
  const co = data.company;
  const companyName = co?.companyName || "Bester.Builds";
  const tagline = co?.tagline || "Large Format Printing";
  const bankName = co?.bankName || "FNB";
  const accountName = co?.accountName || companyName;
  const accountNumber = co?.accountNumber || "62XXXXXXXX";
  const branchCode = co?.branchCode || "250655";
  const contactEmail = co?.email || "accounts@bester.builds";
  const contactPhone = co?.phone || "+27 XX XXX XXXX";
  const website = co?.website || "bester.builds";
  const vatNumber = co?.vatNumber;

  const doc = new PDFDocument({
    size: "A4",
    margins: PAGE.margins,
    info: {
      Title: `Invoice ${data.invoice.invoiceNumber}`,
      Author: companyName,
      Subject: `Invoice for ${data.customer.name}`,
    },
  });

  // Stream directly to response
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="invoice-${data.invoice.invoiceNumber}.pdf"`
  );
  doc.pipe(res);

  let y = PAGE.margins.top;
  const L = PAGE.margins.left;

  // ── Header Band ─────────────────────────────────────────────────────────────
  doc.rect(L, y, W, 72).fill(BRAND.primary);

  // Company name
  doc
    .fillColor(BRAND.white)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(companyName, L + 14, y + 12);

  // Tagline
  doc
    .fillColor("#c4b5fd")
    .fontSize(9)
    .font("Helvetica")
    .text(tagline, L + 14, y + 37);

  // INVOICE label (right-aligned)
  doc
    .fillColor(BRAND.white)
    .fontSize(26)
    .font("Helvetica-Bold")
    .text("INVOICE", L, y + 10, { width: W - 14, align: "right" });

  // Invoice number under the label
  doc
    .fillColor("#c4b5fd")
    .fontSize(10)
    .font("Helvetica")
    .text(data.invoice.invoiceNumber, L, y + 42, { width: W - 14, align: "right" });

  y += 72 + 20;

  // ── Status Badge ────────────────────────────────────────────────────────────
  const statusLabel = data.invoice.status.toUpperCase();
  const badgeColor = statusColor(data.invoice.status);
  const badgeW = 70;
  doc.rect(L + W - badgeW, y - 10, badgeW, 20).fill(badgeColor);
  doc
    .fillColor(BRAND.white)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(statusLabel, L + W - badgeW, y - 4, { width: badgeW, align: "center" });

  // ── Bill To / Invoice Details ────────────────────────────────────────────────
  const colW = W / 2 - 10;

  // Bill To
  doc.fillColor(BRAND.muted).fontSize(8).font("Helvetica-Bold").text("BILL TO", L, y);
  y += 14;
  doc.fillColor(BRAND.dark).fontSize(11).font("Helvetica-Bold").text(data.customer.name, L, y);
  y += 14;
  if (data.customer.company) {
    doc.fillColor(BRAND.text).fontSize(9).font("Helvetica").text(data.customer.company, L, y);
    y += 12;
  }
  if (data.customer.email) {
    doc.fillColor(BRAND.muted).fontSize(9).text(data.customer.email, L, y);
    y += 12;
  }
  if (data.customer.phone) {
    doc.fillColor(BRAND.muted).fontSize(9).text(data.customer.phone, L, y);
    y += 12;
  }
  if (data.customer.address) {
    doc.fillColor(BRAND.muted).fontSize(9).text(data.customer.address, L, y);
    y += 12;
  }
  if (data.customer.city || data.customer.country) {
    doc
      .fillColor(BRAND.muted)
      .fontSize(9)
      .text([data.customer.city, data.customer.country].filter(Boolean).join(", "), L, y);
    y += 12;
  }

  // Invoice Details (right column)
  const detailsX = L + colW + 20;
  let detailY = PAGE.margins.top + 72 + 20 + 14; // align with Bill To start

  const detail = (label: string, value: string) => {
    doc.fillColor(BRAND.muted).fontSize(8).font("Helvetica-Bold").text(label, detailsX, detailY, { width: colW });
    doc.fillColor(BRAND.dark).fontSize(9).font("Helvetica").text(value, detailsX + 90, detailY, { width: colW - 90 });
    detailY += 14;
  };

  detail("Issue Date:", fmtDate(data.invoice.issueDate));
  detail("Due Date:", fmtDate(data.invoice.dueDate));
  if (data.order) {
    detail("Order Ref:", data.order.orderNumber);
    detail("Job:", data.order.title);
  }

  // Separator line
  const sepY = Math.max(y, detailY) + 10;
  doc.moveTo(L, sepY).lineTo(L + W, sepY).strokeColor(BRAND.border).lineWidth(1).stroke();
  y = sepY + 16;

  // ── Line Items Table ─────────────────────────────────────────────────────────
  const colDesc = W * 0.48;
  const colQty = W * 0.12;
  const colUnit = W * 0.18;
  const colTotal = W * 0.22;

  // Table header row
  doc.rect(L, y, W, 22).fill(BRAND.dark);
  doc.fillColor(BRAND.white).fontSize(8).font("Helvetica-Bold");
  doc.text("DESCRIPTION", L + 8, y + 7, { width: colDesc });
  doc.text("QTY", L + colDesc, y + 7, { width: colQty, align: "center" });
  doc.text("UNIT PRICE", L + colDesc + colQty, y + 7, { width: colUnit, align: "right" });
  doc.text("TOTAL", L + colDesc + colQty + colUnit, y + 7, { width: colTotal, align: "right" });
  y += 22;

  // Table rows
  data.lineItems.forEach((item, i) => {
    const rowH = 24;
    if (i % 2 === 1) {
      doc.rect(L, y, W, rowH).fill(BRAND.primaryLight);
    }
    doc.fillColor(BRAND.text).fontSize(9).font("Helvetica");
    doc.text(item.description, L + 8, y + 7, { width: colDesc - 8, ellipsis: true });
    doc.text(String(parseFloat(String(item.quantity)).toFixed(2)), L + colDesc, y + 7, { width: colQty, align: "center" });
    doc.text(money(item.unitPrice), L + colDesc + colQty, y + 7, { width: colUnit, align: "right" });
    doc.fillColor(BRAND.dark).font("Helvetica-Bold");
    doc.text(money(item.total), L + colDesc + colQty + colUnit, y + 7, { width: colTotal, align: "right" });
    y += rowH;
  });

  // Bottom border of table
  doc.moveTo(L, y).lineTo(L + W, y).strokeColor(BRAND.border).lineWidth(0.5).stroke();
  y += 16;

  // ── Totals Block ─────────────────────────────────────────────────────────────
  const totX = L + W * 0.55;
  const totW = W * 0.45;

  const totRow = (label: string, value: string, bold = false, color = BRAND.text) => {
    doc
      .fillColor(BRAND.muted)
      .fontSize(9)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .text(label, totX, y, { width: totW * 0.55 });
    doc
      .fillColor(color)
      .fontSize(9)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .text(value, totX + totW * 0.55, y, { width: totW * 0.45, align: "right" });
    y += 16;
  };

  totRow("Subtotal:", money(data.invoice.subtotal));
  if (parseFloat(String(data.invoice.discountAmount)) > 0) {
    totRow("Discount:", `- ${money(data.invoice.discountAmount)}`);
  }
  if (parseFloat(String(data.invoice.taxRate)) > 0) {
    totRow(`VAT (${parseFloat(String(data.invoice.taxRate)).toFixed(0)}%):`, money(data.invoice.taxAmount));
  }

  // Total row with background
  doc.rect(totX - 8, y - 4, totW + 8, 26).fill(BRAND.primary);
  doc.fillColor(BRAND.white).fontSize(11).font("Helvetica-Bold");
  doc.text("TOTAL", totX, y + 4, { width: totW * 0.55 });
  doc.text(money(data.invoice.total), totX + totW * 0.55, y + 4, { width: totW * 0.45, align: "right" });
  y += 32;

  if (parseFloat(String(data.invoice.amountPaid)) > 0) {
    totRow("Amount Paid:", money(data.invoice.amountPaid), false, BRAND.accent);
  }

  // Amount Due
  doc.rect(totX - 8, y - 4, totW + 8, 26).fill(BRAND.dark);
  doc.fillColor(BRAND.white).fontSize(11).font("Helvetica-Bold");
  doc.text("AMOUNT DUE", totX, y + 4, { width: totW * 0.55 });
  doc.text(money(data.invoice.amountDue), totX + totW * 0.55, y + 4, { width: totW * 0.45, align: "right" });
  y += 40;

  // ── Notes & Terms ────────────────────────────────────────────────────────────
  if (data.invoice.notes || data.invoice.terms) {
    doc.moveTo(L, y).lineTo(L + W, y).strokeColor(BRAND.border).lineWidth(0.5).stroke();
    y += 12;

    if (data.invoice.notes) {
      doc.fillColor(BRAND.muted).fontSize(8).font("Helvetica-Bold").text("NOTES", L, y);
      y += 12;
      doc.fillColor(BRAND.text).fontSize(9).font("Helvetica").text(data.invoice.notes, L, y, { width: W });
      y += doc.heightOfString(data.invoice.notes, { width: W }) + 10;
    }

    if (data.invoice.terms) {
      doc.fillColor(BRAND.muted).fontSize(8).font("Helvetica-Bold").text("TERMS & CONDITIONS", L, y);
      y += 12;
      doc.fillColor(BRAND.text).fontSize(9).font("Helvetica").text(data.invoice.terms, L, y, { width: W });
      y += doc.heightOfString(data.invoice.terms, { width: W }) + 10;
    }
  }

  // ── Payment Info Box ─────────────────────────────────────────────────────────
  y += 10;
  doc.rect(L, y, W, 58).fill(BRAND.primaryLight);
  doc.fillColor(BRAND.primary).fontSize(9).font("Helvetica-Bold").text("PAYMENT INFORMATION", L + 12, y + 10);
  doc.fillColor(BRAND.text).fontSize(8).font("Helvetica");
  const bankLine = `Bank: ${bankName}  |  Account Name: ${accountName}  |  Account No: ${accountNumber}  |  Branch Code: ${branchCode}${vatNumber ? `  |  VAT: ${vatNumber}` : ""}`;
  const refLine = `Reference: ${data.invoice.invoiceNumber}  |  Email: ${contactEmail}  |  Tel: ${contactPhone}`;
  doc.text(bankLine, L + 12, y + 24, { width: W - 24 });
  doc.text(refLine, L + 12, y + 38, { width: W - 24 });

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = 842 - PAGE.margins.bottom - 20;
  doc.rect(L, footerY, W, 1).fill(BRAND.border);
  doc
    .fillColor(BRAND.muted)
    .fontSize(8)
    .font("Helvetica")
    .text(
      `Thank you for your business! | ${website} | Generated ${format(new Date(), "dd MMM yyyy HH:mm")}`,
      L,
      footerY + 6,
      { width: W, align: "center" }
    );

  doc.end();
}
