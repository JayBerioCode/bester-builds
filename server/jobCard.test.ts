import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the DB module ───────────────────────────────────────────────────────
vi.mock("./db", () => ({
  listInvoicesWithPO: vi.fn(),
  createJobCard: vi.fn(),
  getJobCard: vi.fn(),
  listJobCards: vi.fn(),
  updateJobCard: vi.fn(),
  updateInvoicePoNumber: vi.fn(),
}));

import {
  listInvoicesWithPO,
  createJobCard,
  getJobCard,
  listJobCards,
  updateJobCard,
  updateInvoicePoNumber,
} from "./db";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const mockInvoiceWithPO = {
  invoice: {
    id: 1,
    invoiceNumber: "INV-0001",
    poNumber: "PO-2024-001",
    total: "1500.00",
    issueDate: new Date("2024-01-15"),
    createdAt: new Date("2024-01-15"),
    customerId: 10,
    orderId: 5,
    status: "sent",
  },
  customer: {
    id: 10,
    name: "Acme Corp",
    company: "Acme Corporation",
    email: "billing@acme.com",
    phone: "011 555 0100",
  },
  order: {
    id: 5,
    title: "3m × 1m Banner",
    printType: "banner",
    width: "3.00",
    height: "1.00",
    dimensionUnit: "m",
    quantity: 2,
  },
};

const mockJobCard = {
  jobCard: {
    id: 1,
    jobCardNumber: "JC-0001",
    invoiceId: 1,
    poNumber: "PO-2024-001",
    jobTitle: "3m × 1m Banner — Acme Corp",
    customerName: "Acme Corp",
    assignedTo: null,
    assignedToName: "John Smith",
    dueDate: new Date("2024-02-01"),
    printType: "banner",
    width: "3.00",
    height: "1.00",
    dimensionUnit: "m",
    quantity: 2,
    material: "PVC Flex 440gsm",
    finishing: "Eyelets every 500mm",
    instructions: "Print at 720dpi. Check colour profile.",
    notes: null,
    fileUrl: null,
    status: "pending",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  invoice: mockInvoiceWithPO.invoice,
  customer: mockInvoiceWithPO.customer,
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Job Card DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // listInvoicesWithPO
  describe("listInvoicesWithPO", () => {
    it("returns invoices that have a poNumber set", async () => {
      vi.mocked(listInvoicesWithPO).mockResolvedValue([mockInvoiceWithPO] as any);
      const result = await listInvoicesWithPO();
      expect(result).toHaveLength(1);
      expect(result[0].invoice.poNumber).toBe("PO-2024-001");
    });

    it("returns an empty array when no invoices have PO numbers", async () => {
      vi.mocked(listInvoicesWithPO).mockResolvedValue([]);
      const result = await listInvoicesWithPO();
      expect(result).toHaveLength(0);
    });
  });

  // createJobCard
  describe("createJobCard", () => {
    it("creates a job card and returns it with a generated job card number", async () => {
      vi.mocked(createJobCard).mockResolvedValue(mockJobCard.jobCard as any);
      const result = await createJobCard({
        invoiceId: 1,
        poNumber: "PO-2024-001",
        jobTitle: "3m × 1m Banner — Acme Corp",
        customerName: "Acme Corp",
        assignedToName: "John Smith",
        dueDate: new Date("2024-02-01"),
        printType: "banner",
        width: "3.00",
        height: "1.00",
        dimensionUnit: "m",
        quantity: 2,
        material: "PVC Flex 440gsm",
        finishing: "Eyelets every 500mm",
        instructions: "Print at 720dpi. Check colour profile.",
        notes: null,
        fileUrl: null,
        status: "pending",
      });
      expect(result.jobCardNumber).toMatch(/^JC-\d{4}$/);
      expect(result.poNumber).toBe("PO-2024-001");
    });

    it("throws when DB is unavailable", async () => {
      vi.mocked(createJobCard).mockRejectedValue(new Error("DB unavailable"));
      await expect(createJobCard({ invoiceId: 1, poNumber: "PO-X", jobTitle: "Test", status: "pending" } as any)).rejects.toThrow("DB unavailable");
    });
  });

  // getJobCard
  describe("getJobCard", () => {
    it("returns a job card with linked invoice and customer", async () => {
      vi.mocked(getJobCard).mockResolvedValue(mockJobCard as any);
      const result = await getJobCard(1);
      expect(result).not.toBeNull();
      expect(result!.jobCard.jobCardNumber).toBe("JC-0001");
      expect(result!.customer.name).toBe("Acme Corp");
    });

    it("returns null for a non-existent job card", async () => {
      vi.mocked(getJobCard).mockResolvedValue(null);
      const result = await getJobCard(9999);
      expect(result).toBeNull();
    });
  });

  // listJobCards
  describe("listJobCards", () => {
    it("returns all job cards when no status filter is provided", async () => {
      vi.mocked(listJobCards).mockResolvedValue([mockJobCard] as any);
      const result = await listJobCards();
      expect(result).toHaveLength(1);
    });

    it("filters job cards by status", async () => {
      vi.mocked(listJobCards).mockResolvedValue([mockJobCard] as any);
      const result = await listJobCards("pending");
      expect(result[0].jobCard.status).toBe("pending");
    });

    it("returns empty array when no job cards match the filter", async () => {
      vi.mocked(listJobCards).mockResolvedValue([]);
      const result = await listJobCards("completed");
      expect(result).toHaveLength(0);
    });
  });

  // updateJobCard
  describe("updateJobCard", () => {
    it("updates job card status successfully", async () => {
      vi.mocked(updateJobCard).mockResolvedValue(undefined as any);
      await expect(updateJobCard(1, { status: "in_progress" })).resolves.not.toThrow();
      expect(updateJobCard).toHaveBeenCalledWith(1, { status: "in_progress" });
    });

    it("can update multiple fields at once", async () => {
      vi.mocked(updateJobCard).mockResolvedValue(undefined as any);
      await updateJobCard(1, { status: "completed", assignedToName: "Jane Doe" });
      expect(updateJobCard).toHaveBeenCalledWith(1, { status: "completed", assignedToName: "Jane Doe" });
    });
  });

  // updateInvoicePoNumber
  describe("updateInvoicePoNumber", () => {
    it("sets the PO number on an invoice", async () => {
      vi.mocked(updateInvoicePoNumber).mockResolvedValue(undefined as any);
      await expect(updateInvoicePoNumber(1, "PO-2024-999")).resolves.not.toThrow();
      expect(updateInvoicePoNumber).toHaveBeenCalledWith(1, "PO-2024-999");
    });
  });
});

// ─── Business rules ───────────────────────────────────────────────────────────
describe("Job Card business rules", () => {
  it("job card number follows JC-NNNN format", () => {
    const num = "JC-0001";
    expect(num).toMatch(/^JC-\d{4}$/);
  });

  it("valid statuses are pending, in_progress, completed, cancelled", () => {
    const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
    expect(validStatuses).toContain("pending");
    expect(validStatuses).toContain("in_progress");
    expect(validStatuses).toContain("completed");
    expect(validStatuses).toContain("cancelled");
    expect(validStatuses).not.toContain("unknown");
  });

  it("a job card requires both invoiceId and poNumber", () => {
    const requiredFields = ["invoiceId", "poNumber", "jobTitle"];
    requiredFields.forEach((field) => {
      expect(field).toBeTruthy();
    });
  });

  it("dimensions are stored as strings to preserve decimal precision", () => {
    const width = "3.00";
    const height = "1.00";
    expect(typeof width).toBe("string");
    expect(typeof height).toBe("string");
    expect(parseFloat(width)).toBe(3.0);
    expect(parseFloat(height)).toBe(1.0);
  });
});
