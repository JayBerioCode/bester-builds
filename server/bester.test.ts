import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getCustomers: vi.fn().mockResolvedValue([]),
  getCustomerById: vi.fn().mockResolvedValue(null),
  createCustomer: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", email: "test@example.com", phone: "0821234567", company: "Test Co", type: "business", status: "active", industry: "retail", createdAt: new Date(), updatedAt: new Date() }),
  updateCustomer: vi.fn().mockResolvedValue(undefined),
  deleteCustomer: vi.fn().mockResolvedValue(undefined),
  getLeads: vi.fn().mockResolvedValue([]),
  createLead: vi.fn().mockResolvedValue({ id: 1, name: "Lead 1", email: "lead@example.com", status: "new", source: "website", createdAt: new Date(), updatedAt: new Date() }),
  updateLead: vi.fn().mockResolvedValue(undefined),
  deleteLead: vi.fn().mockResolvedValue(undefined),
  getInteractionsByCustomer: vi.fn().mockResolvedValue([]),
  createInteraction: vi.fn().mockResolvedValue({ id: 1, customerId: 1, type: "call", notes: "Called client", createdAt: new Date(), updatedAt: new Date() }),
  getInventoryItems: vi.fn().mockResolvedValue([]),
  createInventoryItem: vi.fn().mockResolvedValue({ id: 1, name: "Vinyl Roll", sku: "VIN-001", category: "substrate", quantity: 10, unit: "roll", unitCost: "250.00", reorderLevel: 2, createdAt: new Date(), updatedAt: new Date() }),
  updateInventoryItem: vi.fn().mockResolvedValue(undefined),
  deleteInventoryItem: vi.fn().mockResolvedValue(undefined),
  getInventoryTransactions: vi.fn().mockResolvedValue([]),
  createInventoryTransaction: vi.fn().mockResolvedValue({ id: 1, itemId: 1, type: "in", quantity: 5, notes: "Restock", createdAt: new Date() }),
  getOrders: vi.fn().mockResolvedValue([]),
  getOrderById: vi.fn().mockResolvedValue(null),
  getOrderItems: vi.fn().mockResolvedValue([]),
  createOrder: vi.fn().mockResolvedValue({ id: 1, orderNumber: "ORD-001", title: "Banner Print", status: "quote", priority: "normal", customerId: 1, createdAt: new Date(), updatedAt: new Date() }),
  updateOrder: vi.fn().mockResolvedValue(undefined),
  deleteOrder: vi.fn().mockResolvedValue(undefined),
  getInvoices: vi.fn().mockResolvedValue([]),
  getInvoiceById: vi.fn().mockResolvedValue(null),
  createInvoice: vi.fn().mockResolvedValue({ id: 1, invoiceNumber: "INV-001", orderId: 1, customerId: 1, status: "draft", subtotal: "1000.00", tax: "150.00", total: "1150.00", amountDue: "1150.00", createdAt: new Date(), updatedAt: new Date() }),
  updateInvoice: vi.fn().mockResolvedValue(undefined),
  getPayments: vi.fn().mockResolvedValue([]),
  createPayment: vi.fn().mockResolvedValue({ id: 1, invoiceId: 1, customerId: 1, amount: "1150.00", method: "bank_transfer", status: "completed", paidAt: new Date(), createdAt: new Date(), updatedAt: new Date() }),
  updatePayment: vi.fn().mockResolvedValue(undefined),
  getEmployees: vi.fn().mockResolvedValue([]),
  getEmployeeById: vi.fn().mockResolvedValue(null),
  createEmployee: vi.fn().mockResolvedValue({ id: 1, name: "John Doe", role: "print_operator", status: "active", createdAt: new Date(), updatedAt: new Date() }),
  updateEmployee: vi.fn().mockResolvedValue(undefined),
  deleteEmployee: vi.fn().mockResolvedValue(undefined),
  getTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn().mockResolvedValue({ id: 1, title: "Print banners", status: "pending", priority: "normal", createdAt: new Date(), updatedAt: new Date() }),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  getAppointments: vi.fn().mockResolvedValue([]),
  createAppointment: vi.fn().mockResolvedValue({ id: 1, title: "Client Meeting", type: "client_consultation", status: "scheduled", startTime: new Date(), endTime: new Date(), createdAt: new Date(), updatedAt: new Date() }),
  updateAppointment: vi.fn().mockResolvedValue(undefined),
  deleteAppointment: vi.fn().mockResolvedValue(undefined),
  getAnalyticsSummary: vi.fn().mockResolvedValue({ totalCustomers: 5, totalRevenue: 25000, activeOrders: 3, pendingInvoices: 2, lowStockItems: 1, pendingTasks: 4, activeEmployees: 6, totalOrders: 12 }),
  getRevenueByMonth: vi.fn().mockResolvedValue([{ month: "Jan 2026", revenue: 12000 }, { month: "Feb 2026", revenue: 18000 }]),
  getOrdersByStatus: vi.fn().mockResolvedValue([{ status: "in_production", count: 3 }, { status: "completed", count: 9 }]),
  getTopCustomers: vi.fn().mockResolvedValue([{ id: 1, name: "ABC Corp", totalRevenue: 15000 }]),
  getOrdersByStatusCount: vi.fn().mockResolvedValue([]),
}));

// ─── Auth context factory ─────────────────────────────────────────────────────
function makeCtx(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "admin@besterbuilds.co.za",
      name: "Admin User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns current user when authenticated", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("admin@besterbuilds.co.za");
  });

  it("returns null when unauthenticated", async () => {
    const ctx = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── CRM Tests ────────────────────────────────────────────────────────────────
describe("crm.listCustomers", () => {
  it("returns empty array when no customers exist", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.crm.listCustomers();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("crm.createCustomer", () => {
  it("creates a customer with required fields", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.crm.createCustomer({ name: "Test Client", type: "business" });
    expect(result).toBeDefined();
    expect(result.name).toBe("Test Client");
  });
});

describe("crm.createLead", () => {
  it("creates a lead with required fields", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.crm.createLead({ name: "Lead 1", source: "website" });
    expect(result).toBeDefined();
    expect(result.name).toBe("Lead 1");
  });
});

// ─── Inventory Tests ──────────────────────────────────────────────────────────
describe("inventory.listItems", () => {
  it("returns inventory items list", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.inventory.listItems();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("inventory.createItem", () => {
  it("creates an inventory item", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.inventory.createItem({
      name: "Vinyl Roll",
      sku: "VIN-001",
      category: "substrate",
      unit: "roll",
      unitCost: "250.00",
    });
    expect(result).toBeDefined();
    expect(result.name).toBe("Vinyl Roll");
  });
});

// ─── Orders Tests ─────────────────────────────────────────────────────────────
describe("orders.list", () => {
  it("returns orders list", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.orders.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("orders.create", () => {
  it("creates an order with required fields", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.orders.create({
      title: "Banner Print",
      customerId: 1,
      priority: "normal",
    });
    expect(result).toBeDefined();
    expect(result.orderNumber).toMatch(/ORD-/);
  });
});

// ─── Invoices Tests ───────────────────────────────────────────────────────────
describe("invoices.list", () => {
  it("returns invoices list", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.invoices.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("invoices.create", () => {
  it("creates an invoice", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await caller.invoices.create({
      orderId: 1,
      customerId: 1,
      subtotal: "1000.00",
      total: "1150.00",
      amountDue: "1150.00",
      dueDate,
    });
    expect(result).toBeDefined();
    expect(result.invoiceNumber).toMatch(/INV-/);
  });
});

// ─── Payments Tests ───────────────────────────────────────────────────────────
describe("payments.list", () => {
  it("returns payments list", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.payments.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("payments.create", () => {
  it("records a payment", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.payments.create({
      invoiceId: 1,
      customerId: 1,
      amount: "1150.00",
      method: "bank_transfer",
    });
    expect(result).toBeDefined();
    expect(result.amount).toBe("1150.00");
  });
});

// ─── Employees Tests ──────────────────────────────────────────────────────────
describe("employees.list", () => {
  it("returns employees list", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.employees.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("employees.create", () => {
  it("creates an employee", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.employees.create({
      name: "John Doe",
      role: "print_operator",
    });
    expect(result).toBeDefined();
    expect(result.name).toBe("John Doe");
    expect(result.role).toBe("print_operator");
  });
});

// ─── Tasks Tests ──────────────────────────────────────────────────────────────
describe("tasks.list", () => {
  it("returns tasks list", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("tasks.create", () => {
  it("creates a task", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.tasks.create({ title: "Print banners" });
    expect(result).toBeDefined();
    expect(result.title).toBe("Print banners");
  });
});

// ─── Analytics Tests ──────────────────────────────────────────────────────────
describe("analytics.summary", () => {
  it("returns business summary metrics", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.summary();
    expect(result).toBeDefined();
    expect(typeof result.totalCustomers).toBe("number");
    expect(typeof result.totalRevenue).toBe("number");
    expect(typeof result.activeOrders).toBe("number");
  });
});

describe("analytics.revenueByMonth", () => {
  it("returns monthly revenue data", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.revenueByMonth();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("month");
      expect(result[0]).toHaveProperty("revenue");
    }
  });
});

describe("analytics.topCustomers", () => {
  it("returns top customers by revenue", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.topCustomers();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Scheduling Tests ─────────────────────────────────────────────────────────
describe("scheduling.list", () => {
  it("returns appointments list", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.scheduling.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("scheduling.create", () => {
  it("creates an appointment", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const result = await caller.scheduling.create({
      title: "Client Meeting",
      type: "client_consultation",
      startTime: start,
      endTime: end,
    });
    expect(result).toBeDefined();
    expect(result.title).toBe("Client Meeting");
  });
});
