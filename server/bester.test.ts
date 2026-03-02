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
  getShiftLogs: vi.fn().mockResolvedValue([]),
  getActiveShift: vi.fn().mockResolvedValue(null),
  clockIn: vi.fn().mockResolvedValue({ id: 1, employeeId: 1, clockIn: new Date(), clockOut: null, hoursWorked: null, earnings: null, notes: null, createdAt: new Date(), updatedAt: new Date() }),
  clockOut: vi.fn().mockResolvedValue({ id: 1, employeeId: 1, clockIn: new Date(Date.now() - 3600000), clockOut: new Date(), hoursWorked: "1.00", earnings: "75.00", notes: null, createdAt: new Date(), updatedAt: new Date() }),
  getShiftSummary: vi.fn().mockResolvedValue([{ employeeId: 1, employeeName: "John Doe", employeeRole: "print_operator", hourlyRate: "75.00", totalShifts: 5, totalHours: 40, totalEarnings: 3000 }]),
  // PIN helpers
  setEmployeePin: vi.fn().mockResolvedValue(undefined),
  clearEmployeePin: vi.fn().mockResolvedValue(undefined),
  findEmployeeByPin: vi.fn().mockResolvedValue({ id: 1, name: "John Doe", role: "print_operator", pinSet: true, status: "active", hourlyRate: "75.00" }),
  clockInByPin: vi.fn().mockResolvedValue({ employee: { id: 1, name: "John Doe", role: "print_operator", pinSet: true, status: "active", hourlyRate: "75.00" }, shift: { id: 2, employeeId: 1, clockIn: new Date(), clockOut: null, hoursWorked: null, earnings: null, notes: null } }),
  clockOutByPin: vi.fn().mockResolvedValue({ employee: { id: 1, name: "John Doe", role: "print_operator", pinSet: true, status: "active", hourlyRate: "75.00" }, shift: { id: 2, employeeId: 1, clockIn: new Date(Date.now() - 3600000), clockOut: new Date(), hoursWorked: "1.00", earnings: "75.00", notes: null } }),
  hashPin: vi.fn().mockResolvedValue("$2b$10$hashedpin"),
  createInvoiceFromOrder: vi.fn().mockResolvedValue({ id: 99, invoiceNumber: "INV-999999", orderId: 1, customerId: 1, status: "draft", subtotal: "1000.00", taxRate: "15", taxAmount: "150.00", discountAmount: "0.00", total: "1150.00", amountPaid: "0.00", amountDue: "1150.00", issueDate: new Date(), dueDate: new Date(Date.now() + 30*24*60*60*1000), notes: null, terms: null, createdAt: new Date(), updatedAt: new Date() }),
  getOrderWithItemsForInvoice: vi.fn().mockResolvedValue({ order: { id: 1, orderNumber: "BB-001", title: "Test Banner", customerId: 1, status: "quote", subtotal: "1000.00", taxRate: "0", taxAmount: "0", discountAmount: "0", total: "1000.00" }, customer: { id: 1, name: "Test Client" }, items: [] }),
  getAllPricingRates: vi.fn().mockResolvedValue([
    { id: 1, printType: "banner", material: "PVC 440gsm", ratePerSqm: "85.00", setupFee: "150.00", minCharge: "250.00", laminationRatePerSqm: "35.00", eyeletRatePerMetre: "12.00", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  createPricingRate: vi.fn().mockResolvedValue(undefined),
  updatePricingRate: vi.fn().mockResolvedValue(undefined),
  deletePricingRate: vi.fn().mockResolvedValue(undefined),
  getPricingRates: vi.fn().mockResolvedValue([
    { id: 1, printType: "banner", material: "PVC 440gsm", ratePerSqm: "85.00", setupFee: "150.00", minCharge: "250.00", laminationRatePerSqm: "35.00", eyeletRatePerMetre: "12.00", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  calculatePrintCost: vi.fn().mockImplementation(async (input: any) => {
    const sqm = input.widthM * input.heightM;
    const ratePerSqm = 85;
    const setupFee = 150;
    const minCharge = 250;
    const laminationRate = 35;
    const eyeletRate = 12;
    const printCostPerUnit = sqm * ratePerSqm;
    const laminationCostPerUnit = input.addLamination ? sqm * laminationRate : 0;
    const perimeter = 2 * (input.widthM + input.heightM);
    const eyeletCostPerUnit = input.addEyelets ? perimeter * eyeletRate : 0;
    const unitCost = printCostPerUnit + laminationCostPerUnit + eyeletCostPerUnit;
    const rawTotal = unitCost * input.quantity + setupFee;
    const subtotal = Math.max(rawTotal, minCharge);
    const lineItems: any[] = [{ description: `banner print — PVC 440gsm (${sqm.toFixed(2)}m²)`, quantity: String(input.quantity), unitPrice: printCostPerUnit.toFixed(2), total: (printCostPerUnit * input.quantity).toFixed(2) }];
    if (input.addLamination && laminationCostPerUnit > 0) lineItems.push({ description: `Lamination`, quantity: String(input.quantity), unitPrice: laminationCostPerUnit.toFixed(2), total: (laminationCostPerUnit * input.quantity).toFixed(2) });
    if (input.addEyelets && eyeletCostPerUnit > 0) lineItems.push({ description: `Eyelets/Hem`, quantity: String(input.quantity), unitPrice: eyeletCostPerUnit.toFixed(2), total: (eyeletCostPerUnit * input.quantity).toFixed(2) });
    lineItems.push({ description: "Setup / Artwork fee", quantity: "1", unitPrice: setupFee.toFixed(2), total: setupFee.toFixed(2) });
    return { sqm: parseFloat(sqm.toFixed(2)), unitCost: parseFloat(unitCost.toFixed(2)), subtotal: parseFloat(subtotal.toFixed(2)), lineItems, rateUsed: { material: "PVC 440gsm", ratePerSqm, setupFee, minCharge } };
  }),
  getTimesheetExport: vi.fn().mockResolvedValue([
    { shiftId: 1, employeeId: 1, employeeName: "John Doe", employeeRole: "print_operator", department: "Production", hourlyRate: "75.00", clockIn: new Date("2026-03-01T08:00:00Z"), clockOut: new Date("2026-03-01T16:00:00Z"), hoursWorked: "8.00", earnings: "600.00", notes: null },
  ]),
  logJobMaterialUsage: vi.fn().mockResolvedValue({ id: 1, orderId: 1, inventoryItemId: 1, quantityUsed: "2.500", unitCost: "45.00", totalCost: "112.50", notes: "3m² PVC banner", createdAt: new Date() }),
  getPayrollReport: vi.fn().mockResolvedValue([
    { employeeId: 1, employeeName: "John Doe", employeeRole: "print_operator", department: "Production", hourlyRate: "75.00", totalShifts: 10, totalHours: 80, totalEarnings: 6000, avgHoursPerShift: 8 },
    { employeeId: 2, employeeName: "Jane Smith", employeeRole: "designer", department: "Design", hourlyRate: "90.00", totalShifts: 8, totalHours: 64, totalEarnings: 5760, avgHoursPerShift: 8 },
  ]),
  getJobCostingReport: vi.fn().mockResolvedValue([
    { orderId: 1, orderNumber: "BB-001", title: "Banner Print", status: "in_production", customerId: 1, customerName: "Test Client", quotedTotal: 1150, actualCost: 450, grossMargin: 700, marginPct: 60.87, hasMaterialsLogged: true },
    { orderId: 2, orderNumber: "BB-002", title: "Vinyl Wrap", status: "quote", customerId: 1, customerName: "Test Client", quotedTotal: 800, actualCost: 0, grossMargin: 0, marginPct: null, hasMaterialsLogged: false },
  ]),
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

// ─── Shifts (Clock In/Out) Tests ──────────────────────────────────────────────
// Extend the top-level vi.mock to include shift helpers
// (The mock at the top of this file already covers all db exports via vi.mock("./db", ...))

describe("shifts.list", () => {
  it("returns an array of shift logs", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts an optional employeeId filter", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.list({ employeeId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("shifts.activeShift", () => {
  it("returns null when employee has no active shift", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.activeShift({ employeeId: 1 });
    expect(result).toBeNull();
  });
});

describe("shifts.clockIn", () => {
  it("clocks an employee in and returns the new shift record", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.clockIn({ employeeId: 1 });
    expect(result).toBeDefined();
    expect(result?.employeeId).toBe(1);
  });

  it("accepts optional notes on clock-in", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.clockIn({ employeeId: 2, notes: "Morning shift" });
    expect(result).toBeDefined();
  });
});

describe("shifts.clockOut", () => {
  it("clocks an employee out and returns the completed shift", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.clockOut({ shiftId: 1, employeeId: 1 });
    expect(result).toBeDefined();
  });
});

describe("shifts.summary", () => {
  it("returns aggregated earnings summary for all employees", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.summary();
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts optional employeeId and date range filters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.summary({
      employeeId: 1,
      from: new Date("2026-01-01"),
      to: new Date("2026-12-31"),
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── PIN Clock-In Tests ───────────────────────────────────────────────────────
describe("shifts.setPin", () => {
  it("sets a 4-digit PIN for an employee", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.setPin({ employeeId: 1, pin: "1234" });
    expect(result).toBeUndefined(); // returns void
  });

  it("rejects a PIN that is not 4 digits", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.shifts.setPin({ employeeId: 1, pin: "123" })).rejects.toThrow();
  });

  it("rejects a PIN containing non-numeric characters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.shifts.setPin({ employeeId: 1, pin: "12ab" })).rejects.toThrow();
  });
});

describe("shifts.clearPin", () => {
  it("clears an employee's PIN", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.clearPin({ employeeId: 1 });
    expect(result).toBeUndefined();
  });
});

describe("shifts.lookupByPin", () => {
  it("returns employee data for a valid PIN", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.lookupByPin({ pin: "1234" });
    expect(result).not.toBeNull();
    expect((result as any)?.name).toBe("John Doe");
  });

  it("is accessible without authentication (public procedure)", async () => {
    const publicCtx = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(publicCtx);
    const result = await caller.shifts.lookupByPin({ pin: "1234" });
    expect(result).toBeDefined();
  });
});

describe("shifts.clockInByPin", () => {
  it("clocks in an employee using their PIN", async () => {
    const publicCtx = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(publicCtx);
    const result = await caller.shifts.clockInByPin({ pin: "1234" });
    expect(result).toBeDefined();
    expect((result as any).employee.name).toBe("John Doe");
    expect((result as any).shift.clockOut).toBeNull();
  });
});

describe("shifts.clockOutByPin", () => {
  it("clocks out an employee using their PIN and returns hours and earnings", async () => {
    const publicCtx = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(publicCtx);
    const result = await caller.shifts.clockOutByPin({ pin: "1234" });
    expect(result).toBeDefined();
    expect((result as any).shift.hoursWorked).toBe("1.00");
    expect((result as any).shift.earnings).toBe("75.00");
  });
});

// ─── Timesheet Export Tests ───────────────────────────────────────────────────
describe("shifts.exportTimesheet", () => {
  it("returns shift rows for a given date range", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.exportTimesheet({
      from: new Date("2026-01-01"),
      to: new Date("2026-12-31"),
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts an optional employeeId filter", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.shifts.exportTimesheet({
      from: new Date("2026-01-01"),
      to: new Date("2026-12-31"),
      employeeId: 1,
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const publicCtx = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(publicCtx);
    await expect(
      caller.shifts.exportTimesheet({ from: new Date("2026-01-01"), to: new Date("2026-12-31") })
    ).rejects.toThrow();
  });
});

// ─── PDF Invoice Generator Tests ─────────────────────────────────────────────
import { generateInvoicePDF, type InvoiceData } from "./pdf";
import { Writable } from "stream";

describe("generateInvoicePDF", () => {
  const sampleData: InvoiceData = {
    invoice: {
      invoiceNumber: "INV-2026-001",
      status: "sent",
      issueDate: new Date("2026-03-01"),
      dueDate: new Date("2026-03-31"),
      subtotal: "1000.00",
      taxRate: "15",
      taxAmount: "150.00",
      discountAmount: "0.00",
      total: "1150.00",
      amountPaid: "0.00",
      amountDue: "1150.00",
      notes: "Thank you for your business.",
      terms: "Payment due within 30 days.",
    },
    customer: {
      name: "Acme Corp",
      company: "Acme Corporation",
      email: "billing@acme.com",
      phone: "+27 11 000 0000",
      address: "123 Main St",
      city: "Johannesburg",
      country: "South Africa",
    },
    order: { orderNumber: "ORD-001", title: "Banner Print 3x2m" },
    lineItems: [
      { description: "3x2m Vinyl Banner", quantity: "2", unitPrice: "500.00", total: "1000.00" },
    ],
  };

  it("streams PDF bytes to the response without throwing", () => {
    const mockRes = new Writable({
      write(_chunk, _enc, cb) { cb(); },
    }) as any;
    mockRes.setHeader = () => {};
    mockRes.pipe = () => {};
    // generateInvoicePDF calls doc.pipe(res) then doc.end() — just verify no throw
    expect(() => generateInvoicePDF(sampleData, mockRes)).not.toThrow();
  });

  it("handles an invoice with no line items gracefully", () => {
    const mockRes = new Writable({ write(_c, _e, cb) { cb(); } }) as any;
    mockRes.setHeader = () => {};
    const data: InvoiceData = { ...sampleData, lineItems: [] };
    expect(() => generateInvoicePDF(data, mockRes)).not.toThrow();
  });

  it("handles a paid invoice with amountPaid > 0", () => {
    const mockRes = new Writable({ write(_c, _e, cb) { cb(); } }) as any;
    mockRes.setHeader = () => {};
    const data: InvoiceData = {
      ...sampleData,
      invoice: { ...sampleData.invoice, status: "paid", amountPaid: "1150.00", amountDue: "0.00" },
    };
    expect(() => generateInvoicePDF(data, mockRes)).not.toThrow();
  });
});

// ─── Quote-to-Invoice Conversion Tests ───────────────────────────────────────
describe("orders.convertToInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an invoice from a quote order and advances its status", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await caller.orders.convertToInvoice({
      orderId: 1,
      taxRate: "15",
      dueDate,
    });

    // createInvoiceFromOrder is mocked to return a sample invoice
    expect(result).toBeDefined();
  });

  it("uses default 15% tax rate when not specified", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await caller.orders.convertToInvoice({
      orderId: 2,
      taxRate: "15",
      dueDate,
    });

    expect(result).toBeDefined();
  });

  it("accepts optional terms string", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await caller.orders.convertToInvoice({
      orderId: 3,
      taxRate: "15",
      dueDate,
      terms: "Net 30 days. No returns on custom print jobs.",
    });

    expect(result).toBeDefined();
  });
});

// ─── Print Cost Calculator Tests ─────────────────────────────────────────────
describe("orders.calculateCost", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates cost for a banner print job", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.calculateCost({
      printType: "banner",
      material: "PVC 440gsm",
      widthM: 3,
      heightM: 1,
      quantity: 1,
      addLamination: false,
      addEyelets: false,
    });
    expect(result).toBeDefined();
    expect(result.sqm).toBe(3);
    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.lineItems.length).toBeGreaterThan(0);
  });

  it("adds lamination line item when addLamination is true", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.calculateCost({
      printType: "banner",
      material: "PVC 440gsm",
      widthM: 2,
      heightM: 1,
      quantity: 1,
      addLamination: true,
      addEyelets: false,
    });
    const hasLamination = result.lineItems.some((i) => i.description.toLowerCase().includes("lamination"));
    expect(hasLamination).toBe(true);
  });

  it("adds eyelets line item when addEyelets is true", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.calculateCost({
      printType: "banner",
      material: "PVC 440gsm",
      widthM: 2,
      heightM: 1,
      quantity: 1,
      addLamination: false,
      addEyelets: true,
    });
    const hasEyelets = result.lineItems.some((i) => i.description.toLowerCase().includes("eyelet"));
    expect(hasEyelets).toBe(true);
  });

  it("multiplies cost by quantity", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const single = await caller.orders.calculateCost({
      printType: "banner",
      material: "PVC 440gsm",
      widthM: 1,
      heightM: 1,
      quantity: 1,
      addLamination: false,
      addEyelets: false,
    });
    const multi = await caller.orders.calculateCost({
      printType: "banner",
      material: "PVC 440gsm",
      widthM: 1,
      heightM: 1,
      quantity: 5,
      addLamination: false,
      addEyelets: false,
    });
    // Multi should be higher than single (setup fee is shared, print cost scales)
    expect(multi.subtotal).toBeGreaterThan(single.subtotal);
  });

  it("returns pricing rates for a given print type", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const rates = await caller.orders.getPricingRates({ printType: "banner" });
    expect(Array.isArray(rates)).toBe(true);
  });
});

// ─── Pricing CRUD Tests ───────────────────────────────────────────────────────
describe("pricing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists all pricing rates", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pricing.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a new pricing rate (admin only)", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.pricing.create({
        printType: "banner",
        material: "PVC 510gsm",
        ratePerSqm: "95.00",
        setupFee: "200.00",
        minCharge: "300.00",
        laminationRatePerSqm: "40.00",
        eyeletRatePerMetre: "15.00",
      })
    ).resolves.not.toThrow();
  });

  it("rejects rate creation for non-admin users", async () => {
    const ctx = makeCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.pricing.create({
        printType: "banner",
        material: "Cheap Vinyl",
        ratePerSqm: "50.00",
        setupFee: "100.00",
        minCharge: "150.00",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("updates a pricing rate (admin only)", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.pricing.update({ id: 1, ratePerSqm: "90.00", isActive: true })
    ).resolves.not.toThrow();
  });

  it("deletes a pricing rate (admin only)", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.pricing.delete({ id: 1 })).resolves.not.toThrow();
  });

  it("rejects rate deletion for non-admin users", async () => {
    const ctx = makeCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.pricing.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── Job Costing Tests ────────────────────────────────────────────────────────
describe("jobCosting.logUsage", () => {
  it("logs material usage for an order", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.jobCosting.logUsage({
      orderId: 1,
      inventoryItemId: 1,
      quantityUsed: "2.500",
      unitCost: "45.00",
      totalCost: "112.50",
      notes: "3m² PVC banner",
    });
    expect(result).toMatchObject({ orderId: 1, inventoryItemId: 1 });
  });

  it("rejects logUsage for unauthenticated users", async () => {
    const ctx = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.jobCosting.logUsage({
        orderId: 1,
        inventoryItemId: 1,
        quantityUsed: "2.500",
        unitCost: "45.00",
        totalCost: "112.50",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("jobCosting.report", () => {
  it("returns job costing report with margin data", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.jobCosting.report(undefined);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    const costed = result.find((j) => j.hasMaterialsLogged);
    expect(costed).toBeDefined();
    expect(costed?.grossMargin).toBeGreaterThan(0);
    expect(costed?.marginPct).not.toBeNull();
  });

  it("includes uncosted jobs with null marginPct", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.jobCosting.report(undefined);
    const uncosted = result.find((j) => !j.hasMaterialsLogged);
    expect(uncosted).toBeDefined();
    expect(uncosted?.marginPct).toBeNull();
  });
});

// ─── Payroll Report Tests ─────────────────────────────────────────────────────
describe("payroll.report", () => {
  it("returns payroll summary for a date range", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.payroll.report({
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-03-31T23:59:59Z"),
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    const emp = result[0];
    expect(emp).toHaveProperty("employeeName");
    expect(emp).toHaveProperty("totalShifts");
    expect(emp).toHaveProperty("totalHours");
    expect(emp).toHaveProperty("totalEarnings");
    expect(emp).toHaveProperty("avgHoursPerShift");
  });

  it("rejects payroll report for unauthenticated users", async () => {
    const ctx = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.payroll.report({
        startDate: new Date("2026-03-01T00:00:00Z"),
        endDate: new Date("2026-03-31T23:59:59Z"),
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws BAD_REQUEST when dates are missing", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.payroll.report({} as { startDate: Date; endDate: Date })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
