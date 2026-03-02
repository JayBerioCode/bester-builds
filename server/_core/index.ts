import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getInvoiceForPDF, getPayrollReport, getCompanyProfile, getJobCard } from "../db";
import { generateInvoicePDF } from "../pdf";
import { generatePayrollPDF } from "../payrollPdf";
import { generateJobCardPDF } from "../jobCardPdf";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // PDF Invoice download route
  app.get("/api/invoices/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid invoice ID" });
        return;
      }
      const [data, company] = await Promise.all([getInvoiceForPDF(id), getCompanyProfile()]);
      if (!data || !data.customer) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }
      const inv = data.invoice;
      generateInvoicePDF(
        {
          invoice: {
            ...inv,
            taxRate: inv.taxRate ?? "0",
            taxAmount: inv.taxAmount ?? "0",
            discountAmount: inv.discountAmount ?? "0",
            amountPaid: inv.amountPaid ?? "0",
          },
          customer: data.customer,
          order: data.order ?? null,
          lineItems: data.lineItems,
          company: company ?? undefined,
        },
        res
      );
    } catch (err) {
      console.error("[PDF] Error generating invoice:", err);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Payroll PDF download route
  app.get("/api/payroll/pdf", async (req, res) => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      if (!startDate || !endDate) {
        res.status(400).json({ error: "startDate and endDate query params are required" });
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: "Invalid date format" });
        return;
      }
      const [employees, company] = await Promise.all([getPayrollReport(start, end), getCompanyProfile()]);
      generatePayrollPDF(res, employees, start, end, company ?? undefined);
    } catch (err) {
      console.error("[Payroll PDF] Error:", err);
      res.status(500).json({ error: "Failed to generate payroll PDF" });
    }
  });

  // Job Card PDF download route
  app.get("/api/job-cards/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid job card ID" });
        return;
      }
      const [data, company] = await Promise.all([getJobCard(id), getCompanyProfile()]);
      if (!data || !data.jobCard) {
        res.status(404).json({ error: "Job card not found" });
        return;
      }
      generateJobCardPDF(
        {
          jobCard: data.jobCard,
          invoice: data.invoice ?? { invoiceNumber: "—", total: "0" },
          customer: data.customer ?? { name: "Unknown" },
          company: company ?? undefined,
        },
        res
      );
    } catch (err) {
      console.error("[Job Card PDF] Error:", err);
      res.status(500).json({ error: "Failed to generate job card PDF" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
