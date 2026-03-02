import PDFDocument from "pdfkit";
import type { Response } from "express";

interface PayrollEmployee {
  employeeId: number;
  employeeName: string;
  employeeRole: string;
  department: string | null;
  hourlyRate: string;
  totalShifts: number;
  totalHours: number;
  totalEarnings: number;
  avgHoursPerShift: number;
}

export function generatePayrollPDF(
  res: Response,
  employees: PayrollEmployee[],
  startDate: Date,
  endDate: Date
) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="payroll-report-${startDate.toISOString().slice(0, 10)}-to-${endDate.toISOString().slice(0, 10)}.pdf"`
  );
  doc.pipe(res);

  const purple = "#5B21B6";
  const lightPurple = "#EDE9FE";
  const darkGray = "#1F2937";
  const midGray = "#6B7280";
  const lightGray = "#F3F4F6";
  const white = "#FFFFFF";

  const pageWidth = doc.page.width - 100; // margins

  // ── Header banner ──────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 100).fill(purple);

  doc.fontSize(26).fillColor(white).font("Helvetica-Bold").text("Bester.Builds", 50, 28);
  doc.fontSize(11).fillColor("#C4B5FD").font("Helvetica").text("Large Format Printing — Payroll Report", 50, 58);

  // Date range badge
  const periodText = `${startDate.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })} – ${endDate.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}`;
  const badgeX = doc.page.width - 220;
  doc.roundedRect(badgeX, 32, 170, 36, 6).fill("#7C3AED");
  doc.fontSize(9).fillColor(white).font("Helvetica-Bold").text("PAY PERIOD", badgeX + 10, 38);
  doc.fontSize(9).fillColor("#DDD6FE").font("Helvetica").text(periodText, badgeX + 10, 50);

  doc.y = 120;

  // ── Summary KPI row ────────────────────────────────────────────────────────
  const totalEmployees = employees.length;
  const totalHours = employees.reduce((s, e) => s + e.totalHours, 0);
  const totalEarnings = employees.reduce((s, e) => s + e.totalEarnings, 0);
  const totalShifts = employees.reduce((s, e) => s + e.totalShifts, 0);

  const kpiW = (pageWidth - 30) / 4;
  const kpis = [
    { label: "Employees", value: String(totalEmployees) },
    { label: "Total Shifts", value: String(totalShifts) },
    { label: "Total Hours", value: totalHours.toFixed(1) + " hrs" },
    { label: "Total Payroll", value: "R " + totalEarnings.toFixed(2) },
  ];

  let kpiX = 50;
  for (const kpi of kpis) {
    doc.roundedRect(kpiX, doc.y, kpiW, 54, 6).fill(lightPurple);
    doc.fontSize(9).fillColor(midGray).font("Helvetica").text(kpi.label, kpiX + 10, doc.y + 10);
    doc.fontSize(16).fillColor(purple).font("Helvetica-Bold").text(kpi.value, kpiX + 10, doc.y + 24);
    kpiX += kpiW + 10;
  }

  doc.y += 70;

  // ── Section title ──────────────────────────────────────────────────────────
  doc.fontSize(13).fillColor(darkGray).font("Helvetica-Bold").text("Employee Payroll Summary", 50, doc.y);
  doc.y += 6;
  doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor(purple).lineWidth(1.5).stroke();
  doc.y += 10;

  // ── Table header ───────────────────────────────────────────────────────────
  const cols = [
    { label: "Employee", x: 50, w: 130 },
    { label: "Role / Dept", x: 185, w: 110 },
    { label: "Shifts", x: 300, w: 50 },
    { label: "Total Hours", x: 355, w: 75 },
    { label: "Hourly Rate", x: 435, w: 75 },
    { label: "Gross Earnings", x: 515, w: 85 },
  ];

  doc.rect(50, doc.y, pageWidth, 22).fill(purple);
  for (const col of cols) {
    doc.fontSize(8).fillColor(white).font("Helvetica-Bold").text(col.label, col.x + 4, doc.y + 7, { width: col.w - 4 });
  }
  doc.y += 22;

  // ── Table rows ─────────────────────────────────────────────────────────────
  employees.forEach((emp, idx) => {
    const rowH = 28;
    const rowY = doc.y;

    // Alternate row background
    if (idx % 2 === 0) {
      doc.rect(50, rowY, pageWidth, rowH).fill(lightGray);
    } else {
      doc.rect(50, rowY, pageWidth, rowH).fill(white);
    }

    const roleLabel = emp.employeeRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const deptLabel = emp.department ?? "—";

    doc.fontSize(9).fillColor(darkGray).font("Helvetica-Bold").text(emp.employeeName, cols[0].x + 4, rowY + 6, { width: cols[0].w - 4 });
    doc.fontSize(8).fillColor(midGray).font("Helvetica").text(`${roleLabel} · ${deptLabel}`, cols[1].x + 4, rowY + 8, { width: cols[1].w - 4 });
    doc.fontSize(9).fillColor(darkGray).font("Helvetica").text(String(emp.totalShifts), cols[2].x + 4, rowY + 9, { width: cols[2].w - 4 });
    doc.fontSize(9).fillColor(darkGray).font("Helvetica").text(emp.totalHours.toFixed(2) + " h", cols[3].x + 4, rowY + 9, { width: cols[3].w - 4 });
    doc.fontSize(9).fillColor(darkGray).font("Helvetica").text("R " + parseFloat(emp.hourlyRate).toFixed(2), cols[4].x + 4, rowY + 9, { width: cols[4].w - 4 });

    // Earnings in purple bold
    doc.fontSize(9).fillColor(purple).font("Helvetica-Bold").text("R " + emp.totalEarnings.toFixed(2), cols[5].x + 4, rowY + 9, { width: cols[5].w - 4 });

    doc.y += rowH;
  });

  // ── Totals row ─────────────────────────────────────────────────────────────
  const totalsY = doc.y;
  doc.rect(50, totalsY, pageWidth, 28).fill(purple);
  doc.fontSize(9).fillColor(white).font("Helvetica-Bold").text("TOTALS", cols[0].x + 4, totalsY + 9);
  doc.fontSize(9).fillColor(white).font("Helvetica-Bold").text(String(totalShifts), cols[2].x + 4, totalsY + 9);
  doc.fontSize(9).fillColor(white).font("Helvetica-Bold").text(totalHours.toFixed(2) + " h", cols[3].x + 4, totalsY + 9);
  doc.fontSize(9).fillColor("#DDD6FE").font("Helvetica").text("—", cols[4].x + 4, totalsY + 9);
  doc.fontSize(10).fillColor(white).font("Helvetica-Bold").text("R " + totalEarnings.toFixed(2), cols[5].x + 4, totalsY + 8);
  doc.y += 40;

  // ── Notes section ──────────────────────────────────────────────────────────
  doc.roundedRect(50, doc.y, pageWidth, 60, 6).fill(lightPurple);
  doc.fontSize(9).fillColor(purple).font("Helvetica-Bold").text("Notes for Accountant", 62, doc.y + 10);
  doc.fontSize(8).fillColor(darkGray).font("Helvetica").text(
    "This report reflects completed shifts within the selected pay period. All earnings are calculated at each employee's contracted hourly rate. Please verify against timesheets before processing payment. Generated by Bester.Builds Print Management System.",
    62,
    doc.y + 22,
    { width: pageWidth - 24 }
  );
  doc.y += 72;

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = doc.page.height - 50;
  doc.moveTo(50, footerY - 10).lineTo(50 + pageWidth, footerY - 10).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
  doc.fontSize(8).fillColor(midGray).font("Helvetica").text(
    `Generated on ${new Date().toLocaleString("en-ZA")} · Bester.Builds Large Format Printing · Confidential`,
    50,
    footerY,
    { align: "center", width: pageWidth }
  );

  doc.end();
}
